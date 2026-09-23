const MENTION_THRESHOLD = 3;
const GENERIC_CAPITALIZED = new Set([
    "job", "description", "note", "role", "team", "company", "equal", "opportunity", "employer", "please", "we", "you",
    "our", "the", "this", "that", "responsibilities", "qualifications", "preferred", "required", "requirements",
    "bachelor", "bachelors", "master", "masters", "phd", "united", "states", "us", "usa", "new", "summer", "fall",
    "spring", "winter", "intern", "internship", "llc", "inc", "ltd", "corp", "what", "who", "how", "why", "about",
    "apply", "benefits", "salary", "diversity", "inclusion", "veteran", "disability", "eeo", "may", "will", "your",
    "engineer", "engineers", "engineering", "software", "hardware", "systems", "system", "development", "developer",
    "technology", "technologies", "product", "products", "program", "project", "group", "networking", "solutions",
    "services", "service", "customer", "customers", "management", "data", "cloud", "security", "design", "research",
    "experience", "skills", "years", "work", "position", "candidate", "candidates", "applicants", "employment",
    "science", "computer", "business", "global", "senior", "staff", "principal", "manager", "director", "associate",
]);

function compact(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function countCapitalizedWords(text: string, exclude: Set<string>): [string, number][] {
    const counts = new Map<string, number>();
    for (const word of text.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? []) {
        const key = word.toLowerCase();
        if (exclude.has(key) || GENERIC_CAPITALIZED.has(key)) continue;
        counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
}

/**
 * Some boards identify a company only by an opaque tenant ("fmr" is Fidelity), so the company is
 * whatever the posting calls itself. A repeated name that a hint also contains is the strongest
 * signal; otherwise the most repeated non-generic capitalized word wins.
 */
export function companyFromPostingText(text: string, title: string, hints: string[]): string | null {
    const titleWords = new Set(title.toLowerCase().match(/\b[a-z]+\b/g) ?? []);
    const counts = countCapitalizedWords(text, titleWords);
    const hintText = hints.map(compact).join(" ");
    const confirmed = counts.find(([name, mentions]) => mentions >= 2 && hintText.includes(compact(name)));
    if (confirmed) return confirmed[0];
    const [name, mentions] = counts[0] ?? ["", 0];
    return mentions >= MENTION_THRESHOLD ? name : null;
}
