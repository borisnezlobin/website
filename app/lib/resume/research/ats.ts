import { isRecord, readString, type JsonRecord } from "../json";
import { htmlToPlainText, unescapeHtmlEntities } from "./html-text";
import { readEmbeddedJson } from "./embedded-json";
import { safeFetch, safeFetchJson } from "./safe-fetch";

export type JobPosting = {
    source: "greenhouse" | "lever" | "ashby" | "html";
    url: string;
    company: string | null;
    title: string | null;
    text: string;
};

type AtsMatch = { board: string; jobId: string };
type AtsReader = { pattern: RegExp; read: (match: AtsMatch, url: string) => Promise<JobPosting> };

function titleCaseSlug(slug: string): string {
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function readGreenhouse({ board, jobId }: AtsMatch, url: string): Promise<JobPosting> {
    const job = await safeFetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`);
    if (!isRecord(job)) throw new Error("Greenhouse returned no job");
    return {
        source: "greenhouse",
        url,
        company: readString(job, "company_name") ?? titleCaseSlug(board),
        title: readString(job, "title"),
        text: htmlToPlainText(unescapeHtmlEntities(readString(job, "content") ?? "")),
    };
}

function leverListsText(posting: JsonRecord): string {
    const lists = Array.isArray(posting.lists) ? posting.lists.filter(isRecord) : [];
    return lists
        .map((list) => `${readString(list, "text") ?? ""}\n${htmlToPlainText(readString(list, "content") ?? "")}`)
        .join("\n");
}

async function readLever({ board, jobId }: AtsMatch, url: string): Promise<JobPosting> {
    const posting = await safeFetchJson(`https://api.lever.co/v0/postings/${board}/${jobId}?mode=json`);
    if (!isRecord(posting)) throw new Error("Lever returned no posting");
    return {
        source: "lever",
        url,
        company: titleCaseSlug(board),
        title: readString(posting, "text"),
        text: [readString(posting, "descriptionPlain") ?? "", leverListsText(posting)].join("\n"),
    };
}

// A big company's Ashby board API runs past the fetch cap, so read the one posting page's embedded data.
async function readAshby(_match: AtsMatch, url: string): Promise<JobPosting> {
    const page = await safeFetch(url);
    const appData = readEmbeddedJson(page.body, "window.__appData");
    const posting = isRecord(appData) && isRecord(appData.posting) ? appData.posting : null;
    if (!posting) throw new Error("Ashby page had no posting data");
    const organization = isRecord(appData) && isRecord(appData.organization) ? appData.organization : {};
    return {
        source: "ashby",
        url,
        company: readString(organization, "name"),
        title: readString(posting, "title"),
        text: htmlToPlainText(readString(posting, "descriptionHtml") ?? ""),
    };
}

const ATS_READERS: AtsReader[] = [
    { pattern: /^https:\/\/(?:job-)?boards\.greenhouse\.io\/([\w-]+)\/jobs\/(\d+)/i, read: readGreenhouse },
    { pattern: /^https:\/\/jobs\.lever\.co\/([\w.-]+)\/([0-9a-f-]{36})/i, read: readLever },
    { pattern: /^https:\/\/jobs\.ashbyhq\.com\/([\w.%-]+)\/([0-9a-f-]{36})/i, read: readAshby },
];

export async function readAtsPosting(url: string): Promise<JobPosting | null> {
    for (const reader of ATS_READERS) {
        const match = url.match(reader.pattern);
        if (match) return reader.read({ board: match[1], jobId: match[2] }, url);
    }
    return null;
}
