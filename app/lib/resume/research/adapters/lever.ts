import { isRecord, readString, type JsonRecord } from "../../json";
import { htmlToPlainText } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type LeverTarget = { org: string; jobId: string };

export function leverTarget(url: URL): LeverTarget | null {
    if (!/(^|\.)lever\.co$/i.test(url.hostname)) return null;
    const segments = pathSegments(url).filter((segment) => segment !== "apply");
    if (segments.length < 2 || !/^[0-9a-f-]{20,}$/i.test(segments[1])) return null;
    return { org: segments[0], jobId: segments[1] };
}

function listsText(posting: JsonRecord): string {
    const lists = Array.isArray(posting.lists) ? posting.lists.filter(isRecord) : [];
    return lists
        .map((list) => `${readString(list, "text") ?? ""}\n${htmlToPlainText(readString(list, "content") ?? "")}`)
        .join("\n");
}

async function readLever({ org, jobId }: LeverTarget): Promise<RawPosting> {
    const posting = await safeFetchJson(`https://api.lever.co/v0/postings/${org}/${jobId}`);
    if (!isRecord(posting)) throw new Error("Lever returned no posting");
    const categories = isRecord(posting.categories) ? posting.categories : {};
    return {
        title: readString(posting, "text"),
        company: org.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        location: readString(categories, "location"),
        text: [readString(posting, "descriptionPlain") ?? "", listsText(posting)].join("\n"),
    };
}

export const leverAdapter = defineAdapter({ name: "lever", detect: leverTarget, read: readLever });
