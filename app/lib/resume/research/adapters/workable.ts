import { isRecord, readString } from "../../json";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type WorkableTarget = { account: string; shortcode: string };

export function workableTarget(url: URL): WorkableTarget | null {
    if (!/(^|\.)workable\.com$/i.test(url.hostname)) return null;
    const segments = pathSegments(url);
    const jobIndex = segments.indexOf("j");
    if (jobIndex >= 1 && segments[jobIndex + 1]) return { account: segments[jobIndex - 1], shortcode: segments[jobIndex + 1] };
    const jobsIndex = segments.indexOf("jobs");
    if (jobsIndex >= 0 && segments[jobsIndex + 1]) return { account: url.hostname.split(".")[0], shortcode: segments[jobsIndex + 1] };
    return null;
}

function readLocation(location: unknown): string | null {
    if (typeof location === "string") return location;
    if (!isRecord(location)) return null;
    return [readString(location, "city"), readString(location, "region"), readString(location, "country")]
        .filter(Boolean)
        .join(", ") || null;
}

async function readWorkable({ account, shortcode }: WorkableTarget): Promise<RawPosting> {
    const data = await safeFetchJson(`https://apply.workable.com/api/v1/accounts/${account}/jobs/${shortcode}`);
    if (!isRecord(data)) throw new Error("Workable returned no job");
    const description = [readString(data, "description"), readString(data, "requirements"), readString(data, "benefits")]
        .filter(Boolean)
        .join("\n");
    return {
        title: readString(data, "title"),
        company: account.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        location: readLocation(data.location),
        text: htmlToPlainText(unescapeHtmlEntities(description)),
    };
}

export const workableAdapter = defineAdapter({ name: "workable", detect: workableTarget, read: readWorkable });
