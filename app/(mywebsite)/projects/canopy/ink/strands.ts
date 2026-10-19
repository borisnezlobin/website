import type { Curtain } from "../curtain";
import type { HangingStrand } from "../hanging";
import { between, type Random } from "../random";

export type StrandInk = {
    /** Number of steps the ink fades in from root to tip. */
    bands: number;
    rootDensity: number;
    tipDensity: number;
    /** Multiplier for strands in the back layer. */
    backDensity: number;
    strandWidth: number;
    leafWidth: number;
    /** Leaves per px of strand; 0 for bare whips. */
    leafRate: number;
    leafLength: [number, number];
    leafTilt: [number, number];
};

type Leaf = { strand: number; segment: number; fraction: number; side: number; tilt: number; length: number };

const INK = "#ff0000";

function bandDensity(ink: StrandInk, band: number, back: boolean) {
    const along = Math.pow((band + 0.5) / ink.bands, 1.6);
    const density = ink.rootDensity + (ink.tipDensity - ink.rootDensity) * along;
    return back ? density * ink.backDensity : density;
}

function placeLeaves(random: Random, curtain: Curtain, strands: HangingStrand[], ink: StrandInk) {
    const buckets: Leaf[][] = Array.from({ length: ink.bands * 2 }, () => []);
    curtain.specs.forEach((spec, strand) => {
        const segments = curtain.starts[strand + 1] - curtain.starts[strand] - 1;
        const count = Math.round(spec.length * ink.leafRate);
        let side = random() < 0.5 ? -1 : 1;
        for (let i = 0; i < count; i++) {
            side = -side;
            const share = Math.pow(between(random, 0.06, 1), 0.85);
            const position = Math.min(segments - 0.001, share * segments);
            const band = Math.min(ink.bands - 1, Math.floor(share * ink.bands));
            const back = strands[strand].back ? 1 : 0;
            buckets[back * ink.bands + band].push({
                strand,
                segment: Math.floor(position),
                fraction: position - Math.floor(position),
                side,
                tilt: between(random, ...ink.leafTilt),
                length: between(random, ...ink.leafLength) * (1 - share * 0.35),
            });
        }
    });
    return buckets;
}

function traceStrandRange(ctx: CanvasRenderingContext2D, curtain: Curtain, strand: number, fromShare: number, toShare: number) {
    const first = curtain.starts[strand];
    const segments = curtain.starts[strand + 1] - first - 1;
    const from = Math.floor(fromShare * segments);
    const to = Math.min(segments, Math.ceil(toShare * segments));
    ctx.moveTo(curtain.x[first + from], curtain.y[first + from]);
    for (let node = from + 1; node <= to; node++) ctx.lineTo(curtain.x[first + node], curtain.y[first + node]);
}

function traceLeaf(ctx: CanvasRenderingContext2D, curtain: Curtain, leaf: Leaf) {
    const at = curtain.starts[leaf.strand] + leaf.segment;
    const dx = curtain.x[at + 1] - curtain.x[at];
    const dy = curtain.y[at + 1] - curtain.y[at];
    const x = curtain.x[at] + dx * leaf.fraction;
    const y = curtain.y[at] + dy * leaf.fraction;
    const angle = Math.atan2(dx, dy) + leaf.side * leaf.tilt;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * leaf.length, y + Math.cos(angle) * leaf.length);
}

/**
 * Strands and their leaves fading from full ink at the root to a thin wash at the tip, which the
 * dither breaks up into scattered dots.
 */
export function createStrandPainter(random: Random, curtain: Curtain, strands: HangingStrand[], ink: StrandInk) {
    const leaves = placeLeaves(random, curtain, strands, ink);
    const layers = [false, true].map((back) => strands.flatMap((strand, index) => (strand.back === back ? [index] : [])));

    const paintLayer = (ctx: CanvasRenderingContext2D, layer: number) => {
        const back = layer === 1;
        for (let band = 0; band < ink.bands; band++) {
            ctx.globalAlpha = bandDensity(ink, band, back);
            ctx.lineWidth = ink.strandWidth;
            ctx.beginPath();
            for (const strand of layers[layer]) traceStrandRange(ctx, curtain, strand, band / ink.bands, (band + 1) / ink.bands);
            ctx.stroke();
            ctx.lineWidth = ink.leafWidth;
            ctx.beginPath();
            for (const leaf of leaves[layer * ink.bands + band]) traceLeaf(ctx, curtain, leaf);
            ctx.stroke();
        }
    };

    return (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = INK;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        paintLayer(ctx, 1);
        paintLayer(ctx, 0);
        ctx.globalAlpha = 1;
    };
}
