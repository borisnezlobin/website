const IGNORED_WORDS = new Set([
    "the", "and", "for", "with", "at", "in", "on", "of", "to", "a", "an", "our", "we", "we're", "i'm", "im", "is", "are",
    "hiring", "recruiting", "recruiter", "role", "roles", "position", "job", "jobs", "team", "looking", "candidate",
    "engineer", "engineering", "swe", "sde", "developer", "intern", "internship", "new", "grad", "senior", "junior",
    "staff", "lead", "full", "time", "remote", "company", "startup", "work", "working", "someone", "need", "needs",
]);

/** Words from the request and posting title that can tell two same-named companies apart ("ai", "fintech"). */
export function contextWordsFor(query: string, postingTitle: string | null, company: string | null): string[] {
    const companyWords = new Set((company ?? "").toLowerCase().split(/\s+/));
    const words = `${query} ${postingTitle ?? ""}`
        .replace(/https?:\/\/\S+/g, " ")
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((word) => word.length >= 2 && !IGNORED_WORDS.has(word) && !companyWords.has(word));
    return [...new Set(words)].slice(0, 12);
}
