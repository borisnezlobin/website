/**
 * The award ribbon set beside a project that won something: two notched tails under a struck medallion.
 * Drawn once as an SVG so Typst can place it inline at the entry's own type size.
 * The ink outline carries the shape, so the red tails still read when the page is printed in grayscale.
 */

const INK = "#1b1a19";
const RED = "#cc2a26";

const LEFT_TAIL = "26,38 44,38 30,98 17,78 4,82";
const RIGHT_TAIL = "58,38 40,38 54,98 67,78 80,82";

const MEDALLION_CENTRE = { x: 42, y: 30 };
const MEDALLION_RADIUS = 26;
const CORE_RADIUS = 10;

let cached: string | null = null;

function tail(points: string): string {
    return `<polygon points="${points}" fill="${RED}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
}

function medallion(): string {
    const { x, y } = MEDALLION_CENTRE;
    return [
        `<circle cx="${x}" cy="${y}" r="${MEDALLION_RADIUS}" fill="${INK}"/>`,
        `<circle cx="${x}" cy="${y}" r="${CORE_RADIUS}" fill="${RED}"/>`,
    ].join("");
}

export function awardMarkSvg(): string {
    cached ??= [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 100" width="84" height="100">`,
        tail(LEFT_TAIL),
        tail(RIGHT_TAIL),
        medallion(),
        `</svg>`,
    ].join("");
    return cached;
}
