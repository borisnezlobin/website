const TYPST_LINK_PATTERN = /#link\("[^"]*"\)\[[^\]]*\]/g;
const MIN_CONTENT_WORD_LENGTH = 4;
const SUFFIXES = ["ing", "ed", "es", "s"];

function stem(word: string): string {
    const suffix = SUFFIXES.find((ending) => word.endsWith(ending) && word.length - ending.length >= 3);
    return suffix ? word.slice(0, -suffix.length) : word;
}

// Lead verbs a rewrite may swap freely; stemmed the same way as bullet words.
const SWAPPABLE_VERBS = new Set(
    [
        "build", "built", "design", "designed", "develop", "developed", "engineer", "engineered", "create", "created",
        "lead", "led", "ship", "shipped", "implement", "implemented", "make", "made", "write", "wrote", "written",
        "launch", "launched", "deliver", "delivered",
    ].map(stem),
);

// Connectors that carry no claim, so a rewrite may drop or add them.
const FILLER_WORDS = new Set(
    [
        "that", "which", "with", "from", "into", "onto", "over", "across", "while", "their", "these", "those", "this",
        "also", "very", "more", "both", "each", "such", "through", "within", "using", "enabling", "allowing", "helping",
        "including", "then", "when", "where", "used", "uses", "able",
    ].map(stem),
);

function isFreeWord(word: string): boolean {
    return SWAPPABLE_VERBS.has(word) || FILLER_WORDS.has(word);
}

export function contentStems(text: string): Set<string> {
    const words = text
        .replace(TYPST_LINK_PATTERN, " ")
        .replace(/\\./g, " ")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= MIN_CONTENT_WORD_LENGTH);
    return new Set(words.map(stem));
}

/** A rewrite may reorder, trim, or swap the lead verb, but never bring in a content word of its own. */
export function introducesContentWords(original: string, rewrite: string): boolean {
    const originalStems = contentStems(original);
    return [...contentStems(rewrite)].some((word) => !originalStems.has(word) && !isFreeWord(word));
}

/**
 * Trimming filler is fine; dropping a qualifier such as "solar magnetic" guts the claim. A share-based
 * threshold was tried and let that exact case through (12 of 14 words kept), so every claim word must stay.
 */
export function dropsClaimWords(original: string, rewrite: string): boolean {
    const rewriteStems = contentStems(rewrite);
    return [...contentStems(original)].some((word) => !isFreeWord(word) && !rewriteStems.has(word));
}
