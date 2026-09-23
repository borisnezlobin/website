import { isValidSlug } from "@/app/lib/resume/slug";
import { STANDARD_SLUG } from "@/app/lib/resume/types";

export function cleanSlug(raw: string): string | null {
    let decoded: string;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        return null;
    }
    const lowered = decoded.trim().toLowerCase();
    return isValidSlug(lowered) ? lowered : null;
}

export function queryFromSlug(slug: string): string {
    return slug.replace(/-/g, " ");
}

export function headingFromSlug(slug: string): string {
    const query = queryFromSlug(slug);
    return query.charAt(0).toUpperCase() + query.slice(1);
}

export function isStandardSlug(slug: string): boolean {
    return slug === STANDARD_SLUG;
}

export function resumePath(slug: string): string {
    return `/resume/${slug}`;
}

export const DECLINED_PATH = `${resumePath(STANDARD_SLUG)}?declined=1`;
