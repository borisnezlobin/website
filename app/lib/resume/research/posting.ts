import { findAdapter, type RawPosting } from "./adapters";
import { GENERIC_STRATEGY_NAMES, readGenericPosting } from "./generic";
import { safeFetch } from "./safe-fetch";

export type JobPosting = RawPosting & { source: string; url: string };

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const JOB_HOST_PREFIXES = /^(www|jobs|careers|boards|apply|job-boards|recruiting|hire)\./i;
const ATS_HOSTS =
    /(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|myworkdaysite\.com|workday\.com|smartrecruiters\.com|workable\.com|recruitee\.com|teamtailor\.com|personio\.de|applytojob\.com|breezy\.hr|rippling\.com|dover\.io|pinpointhq\.com|icims\.com|taleo\.net|oraclecloud\.com|successfactors\.com|sapsf\.com|myworkdayjobs\.co\.uk|adp\.com|paylocity\.com|bamboohr\.com|wellfound\.com|angel\.co|linkedin\.com|indeed\.com|glassdoor\.com|ziprecruiter\.com)$/i;
const BLOCKED_HOSTS = /(linkedin\.com|indeed\.com|glassdoor\.com|ziprecruiter\.com|monster\.com)$/i;

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
    return ATS_HOSTS.test(host) ? null : host;
}

function looksLikeRedirectStub(body: string): boolean {
    const start = body.trimStart().slice(0, 400);
    return /^[[{]/.test(start) && /"widget"\s*:\s*"redirect"|"redirectUrl"/.test(start);
}

function redirectedToHomePage(requested: string, final: string): boolean {
    return new URL(requested).pathname.replace(/\/+$/, "") !== "" && new URL(final).pathname.replace(/\/+$/, "") === "";
}

async function readByStrategy(url: string): Promise<JobPosting> {
    const page = await safeFetch(url);
    if (redirectedToHomePage(url, page.url)) throw new Error(`the posting redirected to ${new URL(page.url).hostname}'s home page, so it is probably gone`);
    if (looksLikeRedirectStub(page.body)) throw new Error("the page served a redirect stub, not a posting");
    const read = readGenericPosting(page.body, page.contentType);
    if (!read) throw new Error(`no posting text found (tried ${GENERIC_STRATEGY_NAMES}); the page likely needs JavaScript`);
    return { ...read.posting, source: read.strategy, url: page.url };
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * A board's own API is the reliable source; the page is the fallback. Failures say which route was
 * tried so the admin log shows why a posting came back thin instead of storing a stub as real text.
 */
export async function readJobPosting(url: string): Promise<JobPosting> {
    if (BLOCKED_HOSTS.test(new URL(url).hostname)) {
        throw new Error(`${new URL(url).hostname} blocks automated readers; paste the job text or the company's own posting instead`);
    }
    const adapter = findAdapter(url);
    if (!adapter) return readByStrategy(url);
    try {
        return { ...(await adapter.read()), source: adapter.name, url };
    } catch (adapterError) {
        return readByStrategy(url).catch((pageError) => {
            throw new Error(`${adapter.name} API failed (${describe(adapterError)}); reading the page also failed: ${describe(pageError)}`);
        });
    }
}
