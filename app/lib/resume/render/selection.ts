import type { BulletRewrite } from "../types";
import { catalogSections, EXPERIENCE_ORDER, PROJECT_ORDER, resumeHeader, type CatalogBullet, type CatalogEntry, type CatalogSection } from "./catalog";
import { PAGE, type Typography } from "./typesetting";
import { orderSkillLines } from "./skills";

export type SelectedEntry = CatalogEntry & { bullets: string[] };
export type SelectedSection = { title: string; entries: SelectedEntry[] };

export type ResumeSelection = Typography & {
    page: typeof PAGE;
    header: typeof resumeHeader;
    sections: SelectedSection[];
};

export type ContentChoice = { bullets: CatalogBullet[]; rewrites: BulletRewrite[]; skillsOrder?: string[] };

type EntryOrder = (entries: CatalogEntry[], firstRank: Map<string, number>) => CatalogEntry[];

function sortedByRank(entries: CatalogEntry[], rankOf: (entry: CatalogEntry) => number): CatalogEntry[] {
    return [...entries].sort((a, b) => rankOf(a) - rankOf(b));
}

const entryOrderBySection: Record<string, EntryOrder> = {
    Experience: (entries) => sortedByRank(entries, (entry) => positionOr(EXPERIENCE_ORDER.indexOf(entry.id))),
    Projects: (entries, firstRank) => sortedByRank(entries, (entry) => projectRank(entry, firstRank)),
};

function positionOr(index: number): number {
    return index < 0 ? Number.POSITIVE_INFINITY : index;
}

function projectRank(entry: CatalogEntry, firstRank: Map<string, number>): number {
    const preferred = PROJECT_ORDER.indexOf(entry.id);
    if (preferred >= 0) return preferred;
    return PROJECT_ORDER.length + (firstRank.get(entry.id) ?? Number.POSITIVE_INFINITY);
}

function isShown(entry: CatalogEntry, bulletCount: number): boolean {
    if (entry.always || entry.kind === "text") return true;
    return bulletCount > 0;
}

function bulletTextsByEntry(choice: ContentChoice): Map<string, string[]> {
    const rewritten = new Map(choice.rewrites.map((rewrite) => [rewrite.id, rewrite.text]));
    const byEntry = new Map<string, string[]>();
    for (const bullet of choice.bullets) {
        const texts = byEntry.get(bullet.entry) ?? [];
        texts.push(rewritten.get(bullet.id) ?? bullet.text);
        byEntry.set(bullet.entry, texts);
    }
    return byEntry;
}

function firstRankByEntry(bullets: CatalogBullet[]): Map<string, number> {
    const firstRank = new Map<string, number>();
    bullets.forEach((bullet, rank) => {
        if (!firstRank.has(bullet.entry)) firstRank.set(bullet.entry, rank);
    });
    return firstRank;
}

function selectEntry(entry: CatalogEntry, bullets: string[], skillsOrder?: string[]): SelectedEntry {
    if (entry.kind !== "skills" || !entry.lines) return { ...entry, bullets };
    return { ...entry, lines: orderSkillLines(entry.lines, skillsOrder), bullets };
}

function selectSection(section: CatalogSection, choice: ContentChoice, texts: Map<string, string[]>, firstRank: Map<string, number>): SelectedSection {
    const order = entryOrderBySection[section.title];
    const ordered = order ? order(section.entries, firstRank) : section.entries;
    const entries = ordered
        .filter((entry) => isShown(entry, texts.get(entry.id)?.length ?? 0))
        .map((entry) => selectEntry(entry, texts.get(entry.id) ?? [], choice.skillsOrder));
    return { title: section.title, entries };
}

export function selectSections(choice: ContentChoice): SelectedSection[] {
    const texts = bulletTextsByEntry(choice);
    const firstRank = firstRankByEntry(choice.bullets);
    return catalogSections()
        .map((section) => selectSection(section, choice, texts, firstRank))
        .filter((section) => section.entries.length > 0);
}

export function withTypography(sections: SelectedSection[], typography: Typography): ResumeSelection {
    return { ...typography, page: PAGE, header: resumeHeader, sections };
}
