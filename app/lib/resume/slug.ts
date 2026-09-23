import { STANDARD_SLUG } from "./types";

export const MAX_SLUG_LENGTH = 48;
const RESERVED_SLUGS = new Set([STANDARD_SLUG]);
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toSlug(text: string): string {
    return text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, MAX_SLUG_LENGTH)
        .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
    return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && VALID_SLUG.test(slug);
}

export function isUsableSlug(slug: string): boolean {
    return isValidSlug(slug) && !RESERVED_SLUGS.has(slug);
}

/** The company names the page when there is one; otherwise the focus does. */
export function chooseSlug(slugHint: string | undefined, company: string | null, focus: string): string | null {
    const hint = slugHint?.trim().toLowerCase() ?? "";
    if (isUsableSlug(hint)) return hint;
    const candidates = [company, focus].filter((text): text is string => Boolean(text)).map(toSlug).filter(Boolean);
    return candidates.find(isUsableSlug) ?? withResumeSuffix(candidates[0]);
}

function withResumeSuffix(slug: string | undefined): string | null {
    if (!slug) return null;
    const suffixed = `${slug.slice(0, MAX_SLUG_LENGTH - "-resume".length)}-resume`;
    return isUsableSlug(suffixed) ? suffixed : null;
}
