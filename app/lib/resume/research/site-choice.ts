import { compactName, type SiteProbe } from "./site-probe";

export type ScoredSite = {
    domain: string;
    probedDomain: string;
    title: string;
    description: string;
    snippet: string;
    score: number;
    reasons: string[];
};

type ScoringInput = { probe: SiteProbe; company: string; contextWords: string[] };
type ScoringRule = { label: string; points: (input: ScoringInput) => number };

const PARKED_PAGE =
    /domain (is )?for sale|buy this domain|this domain (may be|is) for sale|parked (free|domain)|coming soon|under construction|hugedomains|sedo|afternic|dan\.com|godaddy|namecheap|domain has expired/i;
const TECH_WORDS =
    /\b(ai|platform|software|apis?|automat\w*|developers?|cloud|data|saas|apps?|infrastructure|engineering|payments?|startup|agents?|llms?|machine learning|security|autonomous|workspace|fintech)\b/gi;
const CALL_TO_ACTION = /book a demo|request a demo|get a demo|get started|sign up|start for free|try (it )?free|contact sales|join the waitlist/i;
const TITLE_SEGMENT_SEPARATOR = /\s[|–—-]\s|\s·\s/;
const MIN_TEXT_FOR_REAL_SITE = 120;
const MIN_WINNING_SCORE = 2;
const SIGNAL_TEXT_CHARS = 1_500;

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nameAsWord(company: string): RegExp {
    const escaped = escapeRegExp(company.trim()).replace(/\s+/g, "\\s*");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
}

function siteText(probe: SiteProbe): string {
    return `${probe.title} ${probe.description} ${probe.pageText.slice(0, SIGNAL_TEXT_CHARS)}`;
}

function titleNamesAnotherBrand({ probe, company }: ScoringInput): boolean {
    const segments = probe.title.split(TITLE_SEGMENT_SEPARATOR);
    return segments.length > 1 && !segments.some((segment) => nameAsWord(company).test(segment));
}

function distinctTechWords(probe: SiteProbe): number {
    const matches = siteText(probe).toLowerCase().match(TECH_WORDS) ?? [];
    return Math.min(new Set(matches).size, 4);
}

function contextMatches({ probe, contextWords }: ScoringInput): number {
    const text = siteText(probe).toLowerCase();
    return contextWords.filter((word) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}([^a-z0-9]|$)`).test(text)).length;
}

function hostIsExactlyTheName({ probe, company }: ScoringInput): boolean {
    return probe.finalHost.split(".")[0] === compactName(company);
}

function redirectedAway({ probe, company }: ScoringInput): boolean {
    return probe.finalHost !== probe.probedDomain && !probe.finalHost.includes(compactName(company));
}

const SCORING_RULES: ScoringRule[] = [
    { label: "domain is exactly the name", points: (input) => (hostIsExactlyTheName(input) ? 2 : 0) },
    { label: "names the company", points: ({ probe, company }) => (nameAsWord(company).test(`${probe.title} ${probe.description}`) ? 3 : 0) },
    { label: "matches the request", points: (input) => 3 * contextMatches(input) },
    { label: "reads like a tech product", points: ({ probe }) => distinctTechWords(probe) },
    { label: "has a demo or sign-up pitch", points: ({ probe }) => (CALL_TO_ACTION.test(siteText(probe)) ? 2 : 0) },
    { label: "links to careers", points: ({ probe }) => (probe.hasCareersLink ? 2 : 0) },
    { label: "title belongs to another brand", points: (input) => (titleNamesAnotherBrand(input) ? -5 : 0) },
    { label: "redirects to an unrelated host", points: (input) => (redirectedAway(input) ? -3 : 0) },
    { label: "parked or holding page", points: ({ probe }) => (PARKED_PAGE.test(siteText(probe)) ? -10 : 0) },
    {
        label: "almost no content",
        points: ({ probe }) => (probe.snippet.length < MIN_TEXT_FOR_REAL_SITE && !probe.description ? -3 : 0),
    },
];

function scoreSite(input: ScoringInput): ScoredSite {
    const applied = SCORING_RULES.map((rule) => ({ label: rule.label, points: rule.points(input) })).filter(
        (rule) => rule.points !== 0,
    );
    const { probe } = input;
    return {
        domain: probe.finalHost,
        probedDomain: probe.probedDomain,
        title: probe.title.slice(0, 160),
        description: probe.description.slice(0, 300),
        snippet: probe.snippet.slice(0, 200),
        score: applied.reduce((total, rule) => total + rule.points, 0),
        reasons: applied.map((rule) => `${rule.points > 0 ? "+" : ""}${rule.points} ${rule.label}`),
    };
}

function uniqueByFinalHost(probes: SiteProbe[]): SiteProbe[] {
    const byHost = new Map<string, SiteProbe>();
    for (const probe of probes) if (!byHost.has(probe.finalHost)) byHost.set(probe.finalHost, probe);
    return [...byHost.values()];
}

export type SiteChoice = { chosen: SiteProbe | null; candidates: ScoredSite[] };

/** Scores each live candidate and keeps the best one, if any scores well enough to trust. */
export function chooseSite(probes: SiteProbe[], company: string, contextWords: string[]): SiteChoice {
    const unique = uniqueByFinalHost(probes);
    const scored = unique.map((probe, order) => ({ probe, order, site: scoreSite({ probe, company, contextWords }) }));
    // Ties go to the earlier candidate, and candidates are listed most canonical first (name.com, name.ai, ...).
    scored.sort((a, b) => b.site.score - a.site.score || a.order - b.order);
    const best = scored[0];
    const chosen = best && best.site.score >= MIN_WINNING_SCORE ? best.probe : null;
    return { chosen, candidates: scored.map(({ site }) => site) };
}
