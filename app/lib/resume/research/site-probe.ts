import { readDocumentText } from "./html-text";
import { safeFetch } from "./safe-fetch";

export type SiteProbe = {
    probedDomain: string;
    finalHost: string;
    title: string;
    description: string;
    snippet: string;
    pageText: string;
    hasCareersLink: boolean;
};

const DOMAIN_PATTERNS = [
    (name: string) => `${name}.com`,
    (name: string) => `${name}.ai`,
    (name: string) => `${name}.io`,
    (name: string) => `${name}.co`,
    (name: string) => `get${name}.com`,
    (name: string) => `try${name}.com`,
    (name: string) => `use${name}.com`,
    (name: string) => `${name}.dev`,
    (name: string) => `${name}.app`,
    (name: string) => `join${name}.com`,
];

const SNIPPET_CHARS = 400;
const PAGE_TEXT_CHARS = 5_000;
const CAREERS_LINK =
    /href="[^"]*\/(careers|jobs)\b[^"]*"|>\s*(careers|jobs|we're hiring|join us)\s*<|\]\([^)\s]*\/(careers|jobs)\b/i;

export function compactName(company: string): string {
    return company
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

export function candidateDomains(company: string, extra: string | null): string[] {
    const name = compactName(company);
    if (name.length < 2) return extra ? [extra] : [];
    const candidates = DOMAIN_PATTERNS.map((pattern) => pattern(name));
    return [...new Set(extra ? [extra, ...candidates] : candidates)];
}

function hostOf(url: string): string {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

export async function probeSite(domain: string): Promise<SiteProbe> {
    const page = await safeFetch(`https://${domain}`);
    const { title, description, text } = readDocumentText(page.body, page.contentType);
    return {
        probedDomain: domain,
        finalHost: hostOf(page.url),
        title,
        description,
        snippet: text.slice(0, SNIPPET_CHARS),
        pageText: [title, description, text].filter(Boolean).join("\n").slice(0, PAGE_TEXT_CHARS),
        hasCareersLink: CAREERS_LINK.test(page.body),
    };
}
