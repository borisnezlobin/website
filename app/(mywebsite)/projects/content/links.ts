import { isInternalHref } from "../components/project-link";
import type { ProjectEntry, ProjectLinkSpec } from "./types";

function primaryLinkLabel(href: string): string {
    if (isInternalHref(href)) return "Read more";
    if (href.includes("github.com")) return "Source";
    return new URL(href).hostname.replace(/^www\./, "");
}

/** The entry's own page first, then its secondary links. */
export function entryLinks(entry: ProjectEntry): ProjectLinkSpec[] {
    const rest = entry.links ?? [];
    if (!entry.href) return rest;
    return [{ label: primaryLinkLabel(entry.href), href: entry.href }, ...rest];
}
