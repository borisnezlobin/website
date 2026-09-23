import type { HiringTarget } from "./gate";
import type { PipelineContext } from "./pipeline-context";
import {
    companyDomainFromUrl,
    contextWordsFor,
    normalizeDomain,
    readJobPosting,
    researchCompany,
    type CompanyResearch,
    type ResearchRecord,
    type ResearchSubject,
} from "./research";

type EarlyResearch = { key: string; work: Promise<CompanyResearch> } | null;

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function urlDomain(context: PipelineContext): string | null {
    return context.jobUrl ? normalizeDomain(companyDomainFromUrl(context.jobUrl)) : null;
}

function subjectFor(
    context: PipelineContext,
    research: ResearchRecord,
    company: string | null,
    guessedDomain: string | null,
): ResearchSubject {
    return {
        company,
        knownDomain: urlDomain(context),
        guessedDomain: normalizeDomain(guessedDomain),
        contextWords: contextWordsFor(context.query, research.posting?.title ?? null, company),
    };
}

function subjectKey(subject: ResearchSubject): string {
    return [subject.company?.toLowerCase(), subject.knownDomain, subject.guessedDomain].join("|");
}

function hasSomethingToResearch(subject: ResearchSubject): boolean {
    return Boolean(subject.company || subject.knownDomain);
}

export async function readPosting(context: PipelineContext): Promise<ResearchRecord> {
    const record: ResearchRecord = { posting: null, postingError: null, company: null };
    context.emit({ stage: "reading", detail: context.jobUrl ? new URL(context.jobUrl).hostname : undefined });
    if (!context.jobUrl) return record;
    try {
        record.posting = await readJobPosting(context.jobUrl);
    } catch (error) {
        record.postingError = describeError(error).slice(0, 300);
    }
    return record;
}

/** With a posting in hand the company is already known, so research runs alongside the screen call. */
export function startEarlyResearch(context: PipelineContext, research: ResearchRecord): EarlyResearch {
    const subject = subjectFor(context, research, research.posting?.company ?? null, null);
    if (!hasSomethingToResearch(subject)) return null;
    return { key: subjectKey(subject), work: researchCompany(subject) };
}

export async function researchTarget(
    context: PipelineContext,
    research: ResearchRecord,
    target: HiringTarget,
    early: EarlyResearch,
): Promise<CompanyResearch | null> {
    const subject = subjectFor(context, research, target.company, null);
    if (!hasSomethingToResearch(subject)) return null;
    context.emit({ stage: "researching", detail: target.company ?? subject.knownDomain ?? undefined });
    if (early && early.key === subjectKey(subject)) return early.work;
    return researchCompany({ ...subject, guessedDomain: normalizeDomain(target.domain) });
}
