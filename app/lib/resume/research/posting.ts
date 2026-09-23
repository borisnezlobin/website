import { readAtsPosting, type JobPosting } from "./ats";
import { readDocumentText } from "./html-text";
import { safeFetch } from "./safe-fetch";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const JOB_HOST_PREFIXES = /^(?:www|jobs|careers|boards|apply)\./i;

export function findUrl(query: string): string | null {
    const match = query.match(URL_PATTERN);
    if (!match) return null;
    const cleaned = match[0].replace(/[).,;!?]+$/, "").replace(/^http:/i, "https:");
    try {
        return new URL(cleaned).href;
    } catch {
        return null;
    }
}

export function companyDomainFromUrl(url: string): string | null {
    const host = new URL(url).hostname.replace(JOB_HOST_PREFIXES, "");
    const isAtsHost = /(greenhouse\.io|lever\.co|ashbyhq\.com|workday|myworkdayjobs|linkedin\.com|indeed\.com)$/i.test(host);
    return isAtsHost ? null : host;
}

async function readHtmlPosting(url: string): Promise<JobPosting> {
    const page = await safeFetch(url);
    const { title, description, text } = readDocumentText(page.body, page.contentType);
    return { source: "html", url: page.url, company: null, title: title || null, text: `${description}\n${text}` };
}

export async function readJobPosting(url: string): Promise<JobPosting> {
    return (await readAtsPosting(url)) ?? (await readHtmlPosting(url));
}
