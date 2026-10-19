import type { Arbor, WoodNode } from "./arbor/growth";
import type { StrandSpec } from "./curtain";
import { between, clamp, type Random } from "./random";

export type HangingOptions = {
    count: number;
    /** Wood thicker than this carries no strands. */
    maxWoodWidth: number;
    /** Strands only start above this line. */
    rootFloor: number;
    /** Range of heights the tips end at, as shares of the screen height. */
    hemline: [number, number];
    minLength: number;
    /** Share of strands pushed into the back layer, drawn paler. */
    backShare: number;
    /** Chance the next strand hangs beside the last one, so strands fall in clumps with gaps between. */
    clumping: number;
};

export type HangingStrand = StrandSpec & { back: boolean };

/** The stalk leaves the twig in the twig's own direction before gravity takes over. */
function hookFrom(node: WoodNode) {
    const fromVertical = Math.atan2(Math.cos(node.heading), Math.sin(node.heading));
    return clamp(fromVertical, -1.1, 1.1) * 0.75;
}

function acceptsStrand(node: WoodNode, width: number, options: HangingOptions, random: Random) {
    if (node.width > options.maxWoodWidth || node.y > options.rootFloor) return false;
    if (node.x < -12 || node.x > width + 12) return false;
    const fallingAway = Math.max(0, Math.sin(node.heading));
    return random() < 0.35 + 0.65 * fallingAway;
}

function nextAnchor(random: Random, arbor: Arbor, previous: HangingStrand | undefined, options: HangingOptions) {
    if (!previous || random() > options.clumping) return Math.floor(random() * arbor.nodes.length);
    const neighbour = previous.node + Math.round(between(random, -6, 6));
    return clamp(neighbour, 0, arbor.nodes.length - 1);
}

/** Strands crowd wherever there is thin wood, and end along a ragged hemline. */
export function chooseHangingStrands(random: Random, arbor: Arbor, width: number, height: number, options: HangingOptions): HangingStrand[] {
    const strands: HangingStrand[] = [];
    for (let attempt = 0; attempt < options.count * 30 && strands.length < options.count; attempt++) {
        const previous = strands[strands.length - 1];
        const index = nextAnchor(random, arbor, previous, options);
        const node = arbor.nodes[index];
        if (!acceptsStrand(node, width, options, random)) continue;
        const edge = Math.min(node.x, width - node.x) / width;
        const hem = height * (between(random, ...options.hemline) + (edge < 0.08 ? 0.05 : 0));
        const length = (hem - node.y) * between(random, 0.55, 1);
        if (length < options.minLength) continue;
        strands.push({ node: index, length, hook: hookFrom(node), response: between(random, 0.8, 1.25), back: random() < options.backShare });
    }
    return strands;
}
