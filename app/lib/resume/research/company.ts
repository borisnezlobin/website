import { readDocumentText } from "./html-text";
import { fetchRecentStories, relevantStories } from "./hacker-news";
import { safeFetch } from "./safe-fetch";
import { chooseSite, type ScoredSite } from "./site-choice";
import { candidateDomains, probeSite, type SiteProbe } from "./site-probe";

export type CompanyResearch = {
    domain: string | null;
    summary: { title: string; description: string } | null;
    candidates: ScoredSite[];
    homepage: string | null;
    secondaryPage: string | null;
    hackerNews: string[];
    sources: string[];
    elapsedMs: number;
};

export type ResearchSubject = {
    company: string | null;
    /** A domain taken from the job posting URL, trusted as the company's own site. */
    knownDomain: string | null;
    /** A domain the screening model guessed; probed alongside the name-based candidates. */
    guessedDomain: string | null;
    contextWords: string[];
};

// Research improves the plan a little; it must not hold the visitor up for long.
export const RESEARCH_BUDGET_MS = 1_500;
const PROBE_SHARE_OF_BUDGET = 0.6;
const SECONDARY_CHARS = 4_000;
const SECONDARY_PATHS = ["/about", "/blog"];
const DOMAIN_PATTERN = /^(?=.{3,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/i;

export function normalizeDomain(candidate: string | null): string | null {
    if (!candidate) return null;
    const host = candidate.trim().replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "");
    return DOMAIN_PATTERN.test(host) ? host.toLowerCase() : null;
}

function withinBudget<T>(work: Promise<T>, fallback: T, budgetMs: number): Promise<T> {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), Math.max(0, budgetMs)).unref());
    return Promise.race([work.catch(() => fallback), timeout]);
}

async function fetchPageSummary(url: string, maxChars: number): Promise<string> {
    const page = await safeFetch(url);
    const { title, description, text } = readDocumentText(page.body, page.contentType);
    return [title, description, text].filter(Boolean).join("\n").slice(0, maxChars);
}

async function firstWorkingSecondaryPage(domain: string): Promise<{ url: string; text: string } | null> {
    const attempts = SECONDARY_PATHS.map((path) =>
        fetchPageSummary(`https://${domain}${path}`, SECONDARY_CHARS).then(
            (text) => ({ url: `https://${domain}${path}`, text }),
            () => null,
        ),
    );
    const results = await Promise.all(attempts);
    return results.find((result) => result !== null) ?? null;
}

type LocatedSite = { probe: SiteProbe | null; candidates: ScoredSite[] };

async function probeAll(domains: string[], budgetMs: number): Promise<SiteProbe[]> {
    const probes = await Promise.all(domains.map((domain) => withinBudget(probeSite(domain), null, budgetMs)));
    return probes.filter((probe): probe is SiteProbe => probe !== null);
}

async function locateSite(subject: ResearchSubject, budgetMs: number): Promise<LocatedSite> {
    if (subject.knownDomain) {
        const probe = await withinBudget(probeSite(subject.knownDomain), null, budgetMs);
        return { probe, candidates: [] };
    }
    if (!subject.company) return { probe: null, candidates: [] };
    const probes = await probeAll(candidateDomains(subject.company, subject.guessedDomain), budgetMs);
    const { chosen, candidates } = chooseSite(probes, subject.company, subject.contextWords);
    return { probe: chosen, candidates };
}

export async function researchCompany(subject: ResearchSubject, budgetMs = RESEARCH_BUDGET_MS): Promise<CompanyResearch> {
    const startedAt = Date.now();
    const deadline = startedAt + budgetMs;
    const stories = subject.company ? withinBudget(fetchRecentStories(subject.company), [], budgetMs) : Promise.resolve([]);
    const { probe, candidates } = await locateSite(subject, budgetMs * PROBE_SHARE_OF_BUDGET);
    const domain = probe?.finalHost ?? null;
    const secondary = domain ? await withinBudget(firstWorkingSecondaryPage(domain), null, deadline - Date.now()) : null;
    const hackerNews = subject.company ? relevantStories(await stories, subject.company, domain) : [];
    return {
        domain,
        summary: probe ? { title: probe.title, description: probe.description } : null,
        candidates,
        homepage: probe?.pageText ?? null,
        secondaryPage: secondary?.text ?? null,
        hackerNews,
        sources: [domain ? `https://${domain}` : null, secondary?.url ?? null].filter((s): s is string => s !== null),
        elapsedMs: Date.now() - startedAt,
    };
}
