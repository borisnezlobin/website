import type { Arbor, Branch } from "../arbor/growth";
import type { NodeLocator } from "../arbor/sway";
import { between, seededRandom, type Random } from "../random";
import { makeRibbonPath, traceRibbon, type RibbonPath } from "./ribbon";

const INK = "#ff0000";
const point = { x: 0, y: 0 };
const BARK_MIN_WIDTH = 9;
/** Every branch ends in a point: its last stretch, this many end widths long (never shorter than TIP_MIN_PX), narrows to nothing. */
const TIP_WIDTHS = 4;
const TIP_MIN_PX = 10;
/** Below 1 the point stays full for longer and sharpens late, like a twig rather than a cone. */
const TIP_FULLNESS = 0.6;

function pointTip(path: RibbonPath) {
    const end = path.length - 1;
    const tipLength = Math.max(TIP_MIN_PX, path.widths[end] * TIP_WIDTHS);
    let fromEnd = 0;
    for (let i = end; i > 0 && fromEnd < tipLength; i--) {
        path.widths[i] *= Math.pow(fromEnd / tipLength, TIP_FULLNESS);
        fromEnd += Math.hypot(path.xs[i] - path.xs[i - 1], path.ys[i] - path.ys[i - 1]);
    }
}

function fillPath(path: RibbonPath, arbor: Arbor, branch: Branch, locate: NodeLocator) {
    path.length = 0;
    branch.nodes.forEach((index, position) => {
        locate(index, point);
        const nextWidth = arbor.nodes[branch.nodes[Math.min(position + 1, branch.nodes.length - 1)]].width;
        path.xs[position] = point.x;
        path.ys[position] = point.y;
        path.widths[position] = position === 0 ? nextWidth : arbor.nodes[index].width;
        path.length++;
    });
    pointTip(path);
    return path;
}

function slice(path: RibbonPath, from: number, to: number, out: RibbonPath) {
    out.length = 0;
    for (let i = from; i < to; i++) {
        out.xs[out.length] = path.xs[i];
        out.ys[out.length] = path.ys[i];
        out.widths[out.length] = path.widths[i];
        out.length++;
    }
    return out;
}

/** Sky-facing side of a branch, as a ribbon offset sign. */
const litSide = (path: RibbonPath) => (path.xs[path.length - 1] >= path.xs[0] ? -1 : 1);

/** The upper edge catches light, which the dither turns into a band of stipple. */
function shadeLimb(ctx: CanvasRenderingContext2D, path: RibbonPath) {
    const side = litSide(path);
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    traceRibbon(ctx, path, side * 0.52, 0.3);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    traceRibbon(ctx, path, side * 0.5, 0.14);
    ctx.fill();
}

/** Long furrows in the bark, broken where the noise says so. */
function furrowLimb(ctx: CanvasRenderingContext2D, path: RibbonPath, random: Random, scratch: RibbonPath) {
    const furrows = Math.round(path.widths[0] / 6);
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    for (let furrow = 0; furrow < furrows * 3; furrow++) {
        const from = Math.floor(random() * (path.length - 4));
        const to = Math.min(path.length, from + 3 + Math.floor(random() * 10));
        if (path.widths[from] < BARK_MIN_WIDTH) continue;
        ctx.beginPath();
        traceRibbon(ctx, slice(path, from, to, scratch), between(random, -0.6, 0.75), between(random, 0.05, 0.1));
        ctx.fill();
    }
}

function fillBranch(ctx: CanvasRenderingContext2D, path: RibbonPath) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    traceRibbon(ctx, path);
    ctx.fill();
}

const longestBranch = (arbor: Arbor) => arbor.branches.reduce((longest, branch) => Math.max(longest, branch.nodes.length), 0);

const BARK_SHADE_WIDTH = 4;

/** A lit edge on wood thick enough to show one, and furrows on wood thicker still. */
function paintBark(ctx: CanvasRenderingContext2D, path: RibbonPath, random: Random, scratch: RibbonPath) {
    if (path.widths[0] < BARK_SHADE_WIDTH) return;
    shadeLimb(ctx, path);
    furrowLimb(ctx, path, random, scratch);
}

const sways = (arbor: Arbor, branch: Branch) => branch.nodes.some((index) => arbor.nodes[index].flex > 0);

/** The wood that never moves, with a lit edge and bark furrows. Drawn once per layout. */
export function paintStillWood(ctx: CanvasRenderingContext2D, arbor: Arbor, locate: NodeLocator) {
    const path = makeRibbonPath(longestBranch(arbor));
    const scratch = makeRibbonPath(longestBranch(arbor));
    const random = seededRandom(17);
    for (const branch of arbor.branches) {
        if (sways(arbor, branch)) continue;
        fillBranch(ctx, fillPath(path, arbor, branch, locate));
        paintBark(ctx, path, random, scratch);
    }
}

const baseWidth = (arbor: Arbor, branch: Branch) => arbor.nodes[branch.nodes[Math.min(1, branch.nodes.length - 1)]].width;

/** Wood that sways, redrawn every frame. The thicker swaying branches keep their bark, furrowed the same way every frame. */
export function createSwayingWoodPainter(arbor: Arbor) {
    const path = makeRibbonPath(longestBranch(arbor));
    const scratch = makeRibbonPath(longestBranch(arbor));
    const swaying = arbor.branches.filter((branch) => sways(arbor, branch));
    const barked = swaying.filter((branch) => baseWidth(arbor, branch) >= BARK_SHADE_WIDTH);
    return (ctx: CanvasRenderingContext2D, locate: NodeLocator) => {
        ctx.fillStyle = INK;
        ctx.beginPath();
        for (const branch of swaying) traceRibbon(ctx, fillPath(path, arbor, branch, locate));
        ctx.fill();
        const random = seededRandom(29);
        for (const branch of barked) paintBark(ctx, fillPath(path, arbor, branch, locate), random, scratch);
    };
}
