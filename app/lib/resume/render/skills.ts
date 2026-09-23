type SkillLine = [string, string];

const SKILL_SEPARATOR = ", ";

function orderRank(order: string[]): (name: string) => number {
    const ranks = new Map(order.map((name, index) => [name.trim().toLowerCase(), index]));
    return (name) => ranks.get(name.trim().toLowerCase()) ?? Number.POSITIVE_INFINITY;
}

function stableSortBy<T>(items: T[], rank: (item: T) => number): T[] {
    return items
        .map((item, index) => ({ item, index, rank: rank(item) }))
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(({ item }) => item);
}

function reorderSkillItems(value: string, rank: (name: string) => number): string {
    return stableSortBy(value.split(SKILL_SEPARATOR), rank).join(SKILL_SEPARATOR);
}

/**
 * `skillsOrder` names may be line labels ("Tools") or individual skills ("OpenCV").
 * Named lines move up in that order, and inside each line named skills move to the front.
 */
export function orderSkillLines(lines: SkillLine[], skillsOrder?: string[]): SkillLine[] {
    if (!skillsOrder?.length) return lines;
    const rank = orderRank(skillsOrder);
    const reordered = lines.map(([label, value]): SkillLine => [label, reorderSkillItems(value, rank)]);
    return stableSortBy(reordered, ([label]) => rank(label));
}
