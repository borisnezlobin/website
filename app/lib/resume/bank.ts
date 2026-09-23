import bulletsJson from "./data/bullets.json";
import entriesJson from "./data/entries.json";

export type BankBullet = {
    id: string;
    entry: string;
    tags: string[];
    priority: number;
    text: string;
    keywords: string[];
};

type BankEntry = {
    id: string;
    kind: string;
    name?: string;
    organization?: string;
    role?: string;
    institution?: string;
};

type EntriesFile = { sections: { title: string; entries: BankEntry[] }[] };

export const bankBullets: BankBullet[] = bulletsJson as BankBullet[];

const bulletsById = new Map(bankBullets.map((bullet) => [bullet.id, bullet]));

export function findBullet(id: string): BankBullet | undefined {
    return bulletsById.get(id);
}

function describeEntry(entry: BankEntry): string {
    if (entry.organization) return `${entry.organization} (${entry.role ?? ""})`;
    return entry.name ?? entry.institution ?? entry.id;
}

const entryLabels = new Map(
    (entriesJson as EntriesFile).sections.flatMap((section) =>
        section.entries.map((entry) => [entry.id, describeEntry(entry)] as const),
    ),
);

export function entryLabel(entryId: string): string {
    return entryLabels.get(entryId) ?? entryId;
}

