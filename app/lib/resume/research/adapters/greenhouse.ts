import { isRecord, readString } from "../../json";
import { htmlToPlainText, unescapeHtmlEntities } from "../html-text";
import { safeFetchJson } from "../safe-fetch";
import { defineAdapter, pathSegments, type RawPosting } from "./types";

type GreenhouseTarget = { board: string; jobId: string };

function titleCaseSlug(slug: string): string {
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function greenhouseTarget(url: URL): GreenhouseTarget | null {
    if (!/(^|\.)greenhouse\.io$/i.test(url.hostname)) return null;
    const embedBoard = url.searchParams.get("for");
    const embedToken = url.searchParams.get("token") ?? url.searchParams.get("gh_jid");
    if (embedBoard && embedToken) return { board: embedBoard, jobId: embedToken };
    const segments = pathSegments(url);
    const jobsIndex = segments.indexOf("jobs");
    if (jobsIndex < 1 || !segments[jobsIndex + 1]) return null;
    return { board: segments[jobsIndex - 1], jobId: segments[jobsIndex + 1] };
}

async function readGreenhouse({ board, jobId }: GreenhouseTarget): Promise<RawPosting> {
    const job = await safeFetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}?questions=false`);
    if (!isRecord(job)) throw new Error("Greenhouse returned no job");
    const location = isRecord(job.location) ? readString(job.location, "name") : null;
    return {
        title: readString(job, "title"),
        company: readString(job, "company_name") ?? titleCaseSlug(board),
        location,
        text: htmlToPlainText(unescapeHtmlEntities(readString(job, "content") ?? "")),
    };
}

export const greenhouseAdapter = defineAdapter({ name: "greenhouse", detect: greenhouseTarget, read: readGreenhouse });
