import type { BulletRewrite, ResumePlan } from "./types";
import { findBullet } from "./bank";
import { dropsClaimWords, introducesContentWords } from "./content-words";

const MAX_LENGTH_RATIO = 1.3;
const TYPST_LINK_PATTERN = /#link\("[^"]*"\)\[[^\]]*\]/g;
const DIGIT_TOKEN_PATTERN = /[^\s]*\d[^\s]*/g;
const NUMBER_WORDS = new Set([
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "twenty", "thirty", "fifty", "hundred", "hundreds", "thousand", "thousands", "million", "millions",
    "billion", "billions", "dozen", "dozens", "double", "triple", "twice", "half",
]);
// An escape plus the character it escapes is one token, so `\$` and a bare `$` never count as the same thing.
const TYPST_MARKUP_TOKENS = /\\[\s\S]|[~#$*_<>@=[\]`{}\\]/g;
const LINE_START_MARKUP = /^[-+=/]/;

export type RewriteRejection = { id: string; reason: string };

function stripLinks(text: string): string {
    return text.replace(TYPST_LINK_PATTERN, " ");
}

function trimPunctuation(token: string): string {
    return token.replace(/^[("'“‘_*]+|[)"'”’.,;:!?_*]+$/g, "");
}

function wordsOf(text: string): string[] {
    return stripLinks(text).split(/\s+/).map(trimPunctuation).filter(Boolean);
}

function countMarkupTokens(text: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const token of text.match(TYPST_MARKUP_TOKENS) ?? []) counts.set(token, (counts.get(token) ?? 0) + 1);
    return counts;
}

function introducesDigits(original: string, rewrite: string): boolean {
    const tokens = (stripLinks(rewrite).match(DIGIT_TOKEN_PATTERN) ?? []).map(trimPunctuation);
    return tokens.some((token) => !original.includes(token));
}

function introducesNumberWords(original: string, rewrite: string): boolean {
    const originalWords = new Set(wordsOf(original).map((word) => word.toLowerCase()));
    return wordsOf(rewrite).some((word) => NUMBER_WORDS.has(word.toLowerCase()) && !originalWords.has(word.toLowerCase()));
}

function dropsOrAddsLinks(original: string, rewrite: string): boolean {
    const originalLinks = original.match(TYPST_LINK_PATTERN) ?? [];
    const rewriteLinks = rewrite.match(TYPST_LINK_PATTERN) ?? [];
    const keepsEvery = originalLinks.every((link) => rewrite.includes(link));
    const addsNone = rewriteLinks.every((link) => original.includes(link));
    return !keepsEvery || !addsNone;
}

function addsTypstMarkup(original: string, rewrite: string): boolean {
    if (LINE_START_MARKUP.test(rewrite.trim()) || /[\r\n]/.test(rewrite)) return true;
    const allowed = countMarkupTokens(stripLinks(original));
    const used = countMarkupTokens(stripLinks(rewrite));
    return [...used].some(([token, count]) => count > (allowed.get(token) ?? 0));
}

function isSentenceStart(previousWord: string | undefined): boolean {
    return previousWord === undefined || /[.!?:]$/.test(previousWord);
}

function looksLikeName(word: string, previousWord: string | undefined): boolean {
    const hasInnerCapital = /^.+[A-Z]/.test(word);
    if (hasInnerCapital) return true;
    return /^[A-Z]/.test(word) && !isSentenceStart(previousWord);
}

function introducesProperNouns(original: string, rewrite: string): boolean {
    const originalWords = new Set(wordsOf(original));
    const rawWords = stripLinks(rewrite).split(/\s+/).filter(Boolean);
    return rawWords.some((raw, index) => {
        const word = trimPunctuation(raw);
        return word.length > 0 && looksLikeName(word, rawWords[index - 1]) && !originalWords.has(word);
    });
}

type RewriteCheck = { reason: string; fails: (original: string, rewrite: string) => boolean };

const REWRITE_CHECKS: RewriteCheck[] = [
    { reason: "too long", fails: (original, rewrite) => rewrite.length > original.length * MAX_LENGTH_RATIO },
    { reason: "new number", fails: introducesDigits },
    { reason: "new number word", fails: introducesNumberWords },
    { reason: "changed links", fails: dropsOrAddsLinks },
    { reason: "new markup", fails: addsTypstMarkup },
    { reason: "new proper noun", fails: introducesProperNouns },
    { reason: "new content word", fails: introducesContentWords },
    { reason: "dropped a claim word", fails: dropsClaimWords },
];

export function rewriteRejectionReason(original: string, rewrite: string): string | null {
    if (rewrite.trim().length === 0) return "empty";
    return REWRITE_CHECKS.find((check) => check.fails(original, rewrite))?.reason ?? null;
}

function uniqueKnownIds(ids: string[]): string[] {
    return [...new Set(ids)].filter((id) => findBullet(id) !== undefined);
}

function screenRewrites(rewrites: BulletRewrite[]) {
    const accepted: BulletRewrite[] = [];
    const rejected: RewriteRejection[] = [];
    const seen = new Set<string>();
    for (const rewrite of rewrites) {
        const bullet = findBullet(rewrite.id);
        if (!bullet || seen.has(rewrite.id)) continue;
        seen.add(rewrite.id);
        const text = rewrite.text.trim();
        const reason = rewriteRejectionReason(bullet.text, text);
        if (reason) rejected.push({ id: rewrite.id, reason });
        else if (text !== bullet.text) accepted.push({ id: rewrite.id, text });
    }
    return { accepted, rejected };
}

export type ValidatedPlan = { plan: ResumePlan; rejectedRewrites: RewriteRejection[] };

/** Keeps only known, unique bullets and rewrites that add no facts; rejected rewrites fall back to the original text. */
export function validatePlan(rankedBulletIds: string[], rewrites: BulletRewrite[]): ValidatedPlan {
    const { accepted, rejected } = screenRewrites(rewrites);
    return { plan: { rankedBulletIds: uniqueKnownIds(rankedBulletIds), rewrites: accepted }, rejectedRewrites: rejected };
}
