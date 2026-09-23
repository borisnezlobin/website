import bulletsJson from "../data/bullets.json";
import entriesJson from "../data/entries.json";

export type EntryKind = "edu" | "exp" | "project" | "text" | "skills";

export type CatalogEntry = {
    id: string;
    kind: EntryKind;
    always?: boolean;
    optional?: boolean;
    maxBullets?: number;
    minBullets?: number;
    lines?: [string, string][];
    [field: string]: unknown;
};

export type CatalogSection = { title: string; entries: CatalogEntry[] };

export type ResumeHeader = { name: string; contacts: [string, string][] };

export type CatalogBullet = {
    id: string;
    entry: string;
    tags: string[];
    priority: number;
    text: string;
    keywords: string[];
};

type EntriesFile = { header: ResumeHeader; sections: CatalogSection[] };

const entriesFile = entriesJson as unknown as EntriesFile;

export const DEFAULT_MAX_BULLETS = 4;

export const SECTION_ORDER = ["Education", "Experience", "Projects", "Skills"];

export const LEAD_EXPERIENCE_ID = "lockheed";

export const EXPERIENCE_ORDER = [LEAD_EXPERIENCE_ID, "jyv-exp", "freelance", "heron"];

export const resumeHeader: ResumeHeader = entriesFile.header;

export const catalogBullets: CatalogBullet[] = bulletsJson as CatalogBullet[];

export const bulletsById = new Map(catalogBullets.map((bullet) => [bullet.id, bullet]));

export function catalogSections(): CatalogSection[] {
    const byTitle = new Map(entriesFile.sections.map((section) => [section.title, section]));
    const ordered = SECTION_ORDER.flatMap((title) => byTitle.get(title) ?? []);
    const unlisted = entriesFile.sections.filter((section) => !SECTION_ORDER.includes(section.title));
    return [...ordered, ...unlisted];
}

export function entryCaps(): Map<string, number> {
    return new Map(
        entriesFile.sections.flatMap((section) =>
            section.entries.map((entry) => [entry.id, entry.maxBullets ?? DEFAULT_MAX_BULLETS] as const),
        ),
    );
}

export function entryMinimums(): Map<string, number> {
    return new Map(
        entriesFile.sections.flatMap((section) =>
            section.entries.flatMap((entry) => (entry.minBullets ? [[entry.id, entry.minBullets] as const] : [])),
        ),
    );
}
