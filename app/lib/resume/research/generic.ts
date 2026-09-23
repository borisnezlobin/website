import { isRecord, readString } from "../json";
import type { RawPosting } from "./adapters";
import { companyFromPostingText } from "./company-name";
import { readEmbeddedJson } from "./embedded-json";
import { htmlToPlainText, readDocumentText, unescapeHtmlEntities } from "./html-text";

const LD_JSON_BLOCK = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const STATE_MARKERS = ["__NEXT_DATA__", "window.__INITIAL_STATE__", "window.__NUXT__", "window.__APOLLO_STATE__"];
const DESCRIPTION_KEY = /(job)?description|descriptionHtml|content|body/i;
const TITLE_KEY = /^(title|name|jobTitle|positionName)$/i;
const MIN_DESCRIPTION_CHARS = 200;
const MIN_STATE_DESCRIPTION_CHARS = 500;
// A single posting is rarely this long; a careers index or search page is.
const MAX_POSTING_CHARS = 40_000;
const MAX_STATE_NODES = 5_000;
const TEMPLATE_PLACEHOLDER = /\{\{[^}]+\}\}|\$\{[^}]+\}/;

function parseJsonLoosely(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function flattenLd(value: unknown): unknown[] {
    if (Array.isArray(value)) return value.flatMap(flattenLd);
    if (!isRecord(value)) return [];
    const graph = Array.isArray(value["@graph"]) ? value["@graph"].flatMap(flattenLd) : [];
    return [value, ...graph];
}

function isJobPostingNode(node: unknown): node is Record<string, unknown> {
    if (!isRecord(node)) return false;
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some((entry) => typeof entry === "string" && entry.toLowerCase() === "jobposting");
}

function readLdLocation(node: Record<string, unknown>): string | null {
    const location = Array.isArray(node.jobLocation) ? node.jobLocation[0] : node.jobLocation;
    if (!isRecord(location) || !isRecord(location.address)) return null;
    const address = location.address;
    return [readString(address, "addressLocality"), readString(address, "addressRegion"), readString(address, "addressCountry")]
        .filter(Boolean)
        .join(", ") || null;
}

export function readJsonLdPosting(html: string): RawPosting | null {
    const blocks = [...html.matchAll(LD_JSON_BLOCK)].map((match) => parseJsonLoosely(match[1].trim()));
    const node = blocks.flatMap(flattenLd).find(isJobPostingNode);
    if (!node) return null;
    const text = htmlToPlainText(unescapeHtmlEntities(readString(node, "description") ?? ""));
    if (text.length < MIN_DESCRIPTION_CHARS) return null;
    const organization = isRecord(node.hiringOrganization) ? readString(node.hiringOrganization, "name") : null;
    return { title: readString(node, "title"), company: organization, location: readLdLocation(node), text };
}

type StateHit = { title: string | null; text: string };

function longDescriptionIn(node: Record<string, unknown>): string | null {
    const found = Object.entries(node)
        .filter(([key, value]) => typeof value === "string" && DESCRIPTION_KEY.test(key))
        .map(([, value]) => htmlToPlainText(unescapeHtmlEntities(value as string)))
        .filter((text) => text.length >= MIN_STATE_DESCRIPTION_CHARS && !TEMPLATE_PLACEHOLDER.test(text))
        .sort((a, b) => b.length - a.length);
    return found[0] ?? null;
}

function titleIn(node: Record<string, unknown>): string | null {
    const entry = Object.entries(node).find(([key, value]) => TITLE_KEY.test(key) && typeof value === "string");
    return entry ? (entry[1] as string) : null;
}

function searchStateForJob(root: unknown): StateHit | null {
    const queue: unknown[] = [root];
    for (let visited = 0; queue.length > 0 && visited < MAX_STATE_NODES; visited++) {
        const node = queue.shift();
        if (Array.isArray(node)) {
            queue.push(...node);
            continue;
        }
        if (!isRecord(node)) continue;
        const text = longDescriptionIn(node);
        if (text && !TEMPLATE_PLACEHOLDER.test(titleIn(node) ?? "")) return { title: titleIn(node), text };
        queue.push(...Object.values(node));
    }
    return null;
}

export function readEmbeddedStatePosting(html: string): RawPosting | null {
    for (const marker of STATE_MARKERS) {
        const state = marker === "__NEXT_DATA__" ? parseJsonLoosely(nextDataOf(html) ?? "") : readEmbeddedJson(html, marker);
        const hit = state ? searchStateForJob(state) : null;
        if (hit) return { title: hit.title, company: null, location: null, text: hit.text };
    }
    return null;
}

function nextDataOf(html: string): string | null {
    return html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? null;
}

// A careers index or search page is not a posting; a real one states what the job involves.
const POSTING_LANGUAGE =
    /\b(responsibilities|requirements|qualifications|what you.{0,3}ll do|about the role|who you are|your profile|we are looking for|minimum qualifications)\b/i;

function readReadableText(html: string, contentType: string): RawPosting | null {
    const { title, description, text } = readDocumentText(html, contentType);
    const body = [description, text].filter(Boolean).join("\n");
    const length = body.trim().length;
    if (length < MIN_DESCRIPTION_CHARS || length > MAX_POSTING_CHARS || !POSTING_LANGUAGE.test(body)) return null;
    return { title: title || null, company: null, location: null, text: body };
}

export type GenericRead = { posting: RawPosting; strategy: string };

const STRATEGIES: { name: string; run: (html: string, contentType: string) => RawPosting | null }[] = [
    { name: "JSON-LD JobPosting", run: (html) => readJsonLdPosting(html) },
    { name: "embedded state JSON", run: (html) => readEmbeddedStatePosting(html) },
    { name: "readable text", run: readReadableText },
];

/** Tried in order; the first strategy that yields a real posting wins. */
export function readGenericPosting(html: string, contentType: string): GenericRead | null {
    for (const strategy of STRATEGIES) {
        const posting = strategy.run(html, contentType);
        if (!posting) continue;
        const company = posting.company ?? companyFromPostingText(posting.text, posting.title ?? "", []);
        return { posting: { ...posting, company }, strategy: strategy.name };
    }
    return null;
}

export const GENERIC_STRATEGY_NAMES = STRATEGIES.map((strategy) => strategy.name).join(", ");
