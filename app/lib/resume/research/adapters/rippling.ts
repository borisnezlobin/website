import { isRecord, readString } from "../../json";
import { companyFromPostingText } from "../company-name";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type RipplingTarget = { org: string; jobId: string };

export function ripplingTarget(url: URL): RipplingTarget | null {
    if (!/(^|\.)rippling\.com$/i.test(url.hostname)) return null;
    const segments = pathSegments(url);
    const jobsIndex = segments.indexOf("jobs");
    if (jobsIndex < 1 || !segments[jobsIndex + 1]) return null;
    return { org: segments[jobsIndex - 1], jobId: segments[jobsIndex + 1] };
}

/** Rippling's description is an object of HTML sections, keyed by section name. */
function sectionsText(description: unknown): string {
    if (typeof description === "string") return htmlToPlainText(unescapeHtmlEntities(description));
    if (!isRecord(description)) return "";
    return Object.values(description)
        .filter((section): section is string => typeof section === "string")
        .map((section) => htmlToPlainText(unescapeHtmlEntities(section)))
        .join("\n");
}

async function readRippling({ org, jobId }: RipplingTarget): Promise<RawPosting> {
    const data = await safeFetchJson(`https://api.rippling.com/platform/api/ats/v1/board/${org}/jobs/${jobId}`);
    if (!isRecord(data)) throw new Error("Rippling returned no job");
    const title = readString(data, "name");
    const text = sectionsText(data.description);
    const location = isRecord(data.workLocation) ? readString(data.workLocation, "label") : null;
    return { title, company: companyFromPostingText(text, title ?? "", [org]) ?? org, location, text };
}

export const ripplingAdapter = defineAdapter({ name: "rippling", detect: ripplingTarget, read: readRippling });
