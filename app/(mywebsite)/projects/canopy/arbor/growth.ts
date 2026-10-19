import { between, clamp, lerp, lerpAngle, noise1, type Random } from "../random";

export type WoodNode = {
    x: number;
    y: number;
    width: number;
    /** Direction of growth at this node, in radians (0 is right, π/2 is down). */
    heading: number;
    /** How many px the wind can push this node per radian of lean; 0 where the wood never moves. */
    flex: number;
};

export type Branch = { nodes: number[]; depth: number; rigid: boolean };

export type Arbor = { nodes: WoodNode[]; branches: Branch[] };

export type LimbSeed = { x: number; y: number; angle: number; width: number; length: number };

export type ArborOptions = {
    segment: number;
    /** Distance between side branches along a parent, in px. */
    spacing: [number, number];
    childWidth: [number, number];
    childLength: [number, number];
    /** Angle a side branch leaves its parent at, in radians. */
    spread: [number, number];
    /** How much a new side branch first turns toward the sky before it arches over. */
    rise: number;
    /** How hard wood bends toward the ground as it gets longer and thinner. */
    droop: number;
    wiggle: number;
    maxDepth: number;
    minWidth: number;
    /** Branches at least this wide at their base are limbs, far stiffer than the wood they carry. */
    rigidWidth: number;
    /** px of sway per px of thin wood; scaled down by width. */
    pliancy: number;
    /** Share of `pliancy` the limbs get, so only strong winds move them visibly; 0 or left out keeps them still. */
    limbPliancy?: number;
    maxFlex: number;
    /** Wood stops growing below this line, so the lower screen stays clear. */
    floor: number;
    /** Thin wood that has turned this steeply downward stops: from there on it hangs as a strand. */
    hangingWidth: number;
};

type Bud = { from: number; angle: number; width: number; length: number; depth: number; rigid: boolean };

const DOWN = Math.PI / 2;
const UP = -Math.PI / 2;
const TIP_WIDTH_SHARE = 0.18;

function addNode(arbor: Arbor, x: number, y: number, width: number, heading: number, flex: number) {
    arbor.nodes.push({ x, y, width, heading, flex });
    return arbor.nodes.length - 1;
}

/** Wood is pulled down harder the further out and the thinner it gets, which makes the arch. */
function droopStep(options: ArborOptions, progress: number, width: number) {
    return (options.droop * options.segment * (0.12 + progress * progress)) / (1 + width * 0.2);
}

function sideBranch(random: Random, parent: Bud, from: number, heading: number, width: number, remaining: number, side: number, options: ArborOptions): Bud {
    const leaving = heading + side * between(random, ...options.spread);
    const childWidth = width * between(random, ...options.childWidth);
    return {
        from,
        angle: lerpAngle(leaving, UP, options.rise),
        width: childWidth,
        length: Math.max(remaining * 0.9, parent.length * 0.3) * between(random, ...options.childLength),
        depth: parent.depth + 1,
        rigid: childWidth >= options.rigidWidth,
    };
}

function mayBranch(bud: Bud, width: number, options: ArborOptions) {
    return bud.depth < options.maxDepth && width * options.childWidth[0] >= options.minWidth;
}

function taper(bud: Bud, progress: number, travelled: number, seed: number) {
    const knots = 1 + (noise1(travelled * 0.05 + seed) - 0.5) * 0.16;
    return lerp(bud.width, bud.width * TIP_WIDTH_SHARE, Math.pow(progress, 0.9)) * knots;
}

const STEEP_DOWN = 0.82;

function hasTurnedToHang(heading: number, width: number, options: ArborOptions) {
    return width < options.hangingWidth && Math.sin(heading) > STEEP_DOWN;
}

function growBranch(arbor: Arbor, random: Random, bud: Bud, options: ArborOptions, queue: Bud[]) {
    const branch: Branch = { nodes: [bud.from], depth: bud.depth, rigid: bud.rigid };
    const start = arbor.nodes[bud.from];
    const seed = random() * 100;
    let { x, y } = start;
    let heading = bud.angle;
    let flex = start.flex;
    const pliancy = options.pliancy * (bud.rigid ? (options.limbPliancy ?? 0) : 1);
    let travelled = 0;
    let untilBranch = between(random, ...options.spacing) * 0.5;
    let side = random() < 0.5 ? -1 : 1;

    while (travelled < bud.length && y < options.floor) {
        const progress = travelled / bud.length;
        const width = Math.max(0.7, taper(bud, progress, travelled, seed));
        heading = lerpAngle(heading, DOWN, clamp(droopStep(options, progress, width), 0, 0.4));
        heading += (noise1(travelled * 0.03 + seed * 7) - 0.5) * options.wiggle;
        x += Math.cos(heading) * options.segment;
        y += Math.sin(heading) * options.segment;
        travelled += options.segment;
        flex = Math.min(options.maxFlex, flex + (options.segment * pliancy) / Math.pow(width, 1.3));
        const node = addNode(arbor, x, y, width, heading, flex);
        branch.nodes.push(node);
        if (hasTurnedToHang(heading, width, options)) break;

        untilBranch -= options.segment;
        if (untilBranch > 0 || !mayBranch(bud, width, options)) continue;
        queue.push(sideBranch(random, bud, node, heading, width, bud.length - travelled, side, options));
        side = -side;
        untilBranch = between(random, ...options.spacing);
    }
    arbor.branches.push(branch);
}

/** Grows limbs breadth first, so parents always come before their side branches. */
export function growArbor(random: Random, seeds: LimbSeed[], options: ArborOptions): Arbor {
    const arbor: Arbor = { nodes: [], branches: [] };
    const queue: Bud[] = seeds.map((seed) => ({
        from: addNode(arbor, seed.x, seed.y, seed.width, seed.angle, 0),
        angle: seed.angle,
        width: seed.width,
        length: seed.length,
        depth: 0,
        rigid: true,
    }));
    while (queue.length) growBranch(arbor, random, queue.shift()!, options, queue);
    return arbor;
}
