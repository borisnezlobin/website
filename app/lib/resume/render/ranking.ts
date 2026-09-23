import { bulletsById, catalogBullets, entryCaps, entryMinimums, LEAD_EXPERIENCE_ID, type CatalogBullet } from "./catalog";

function knownUniqueBullets(ids: string[]): CatalogBullet[] {
    const seen = new Set<string>();
    const bullets: CatalogBullet[] = [];
    for (const id of ids) {
        const bullet = bulletsById.get(id);
        if (!bullet || seen.has(id)) continue;
        seen.add(id);
        bullets.push(bullet);
    }
    return bullets;
}

function byPriority(a: CatalogBullet, b: CatalogBullet): number {
    return a.priority - b.priority;
}

function guaranteedBullets(ranked: CatalogBullet[]): CatalogBullet[] {
    const minimums = entryMinimums();
    const taken = new Map<string, number>();
    return ranked.filter((bullet) => {
        const count = taken.get(bullet.entry) ?? 0;
        if (count >= (minimums.get(bullet.entry) ?? 0)) return false;
        taken.set(bullet.entry, count + 1);
        return true;
    });
}

function leadExperienceFirst(ranked: CatalogBullet[]): CatalogBullet[] {
    const guaranteed = guaranteedBullets(ranked);
    const lead = guaranteed.filter((bullet) => bullet.entry === LEAD_EXPERIENCE_ID);
    const others = guaranteed.filter((bullet) => bullet.entry !== LEAD_EXPERIENCE_ID);
    const front = new Set(guaranteed.map((bullet) => bullet.id));
    return [...lead, ...others, ...ranked.filter((bullet) => !front.has(bullet.id))];
}

/**
 * The plan's order first, then every bullet it left out by priority so a short plan can still fill the page.
 * Entries with a minBullets floor (Lockheed Martin) have their best bullets pulled to the front, so fitting the page
 * never trims them away.
 */
export function rankBullets(rankedIds: string[]): CatalogBullet[] {
    const planned = knownUniqueBullets(rankedIds);
    const plannedIds = new Set(planned.map((bullet) => bullet.id));
    const rest = catalogBullets.filter((bullet) => !plannedIds.has(bullet.id)).sort(byPriority);
    return leadExperienceFirst([...planned, ...rest]);
}

export function exactBullets(ids: string[]): CatalogBullet[] {
    return knownUniqueBullets(ids);
}

export function capPerEntry(bullets: CatalogBullet[]): CatalogBullet[] {
    const caps = entryCaps();
    const used = new Map<string, number>();
    return bullets.filter((bullet) => {
        const count = used.get(bullet.entry) ?? 0;
        if (count >= (caps.get(bullet.entry) ?? 0)) return false;
        used.set(bullet.entry, count + 1);
        return true;
    });
}
