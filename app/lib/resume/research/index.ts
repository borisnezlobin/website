import type { JobPosting } from "./ats";
import type { CompanyResearch } from "./company";

export { findUrl, companyDomainFromUrl, readJobPosting } from "./posting";
export { researchCompany, normalizeDomain } from "./company";
export { contextWordsFor } from "./context-words";
export type { JobPosting } from "./ats";
export type { CompanyResearch, ResearchSubject } from "./company";

// About 6k tokens at roughly four characters per token.
const RESEARCH_CHAR_BUDGET = 24_000;
const POSTING_CHAR_BUDGET = 12_000;

export type ResearchRecord = {
    posting: JobPosting | null;
    postingError: string | null;
    company: CompanyResearch | null;
};

function postingSection(posting: JobPosting | null): string {
    if (!posting) return "";
    const heading = [posting.title, posting.company].filter(Boolean).join(" at ");
    return `## Job posting${heading ? `: ${heading}` : ""}\n${posting.text.slice(0, POSTING_CHAR_BUDGET)}`;
}

function whatTheCompanyDoes(company: CompanyResearch, name: string | null): string {
    if (!company.summary || !company.domain) return "";
    const { title, description } = company.summary;
    return `## What ${name ?? company.domain} does\nWebsite: ${company.domain}\n${[title, description].filter(Boolean).join("\n")}`;
}

function companySections(company: CompanyResearch | null, name: string | null): string[] {
    if (!company) return [];
    return [
        whatTheCompanyDoes(company, name),
        company.homepage ? `## Company homepage (${company.domain})\n${company.homepage}` : "",
        company.secondaryPage ? `## Company about or blog page\n${company.secondaryPage}` : "",
        company.hackerNews.length ? `## Recent Hacker News stories\n${company.hackerNews.join("\n")}` : "",
    ];
}

export function composeResearchText(record: ResearchRecord, companyName: string | null): string {
    const [summary, ...companyDetail] = companySections(record.company, companyName);
    return [summary ?? "", postingSection(record.posting), ...companyDetail]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, RESEARCH_CHAR_BUDGET);
}
