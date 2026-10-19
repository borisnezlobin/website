import { growArbor, type Arbor } from "@/app/(mywebsite)/projects/canopy/arbor/growth";
import type { NodeLocator } from "@/app/(mywebsite)/projects/canopy/arbor/sway";
import type { CanopyLayout, CanopyLook } from "@/app/(mywebsite)/projects/canopy/canopy-engine";
import { createCurtain } from "@/app/(mywebsite)/projects/canopy/curtain";
import { chooseHangingStrands } from "@/app/(mywebsite)/projects/canopy/hanging";
import { createStrandPainter, type StrandInk } from "@/app/(mywebsite)/projects/canopy/ink/strands";
import { createSwayingWoodPainter, paintStillWood } from "@/app/(mywebsite)/projects/canopy/ink/wood";
import { between, seededRandom, type Random } from "@/app/(mywebsite)/projects/canopy/random";
import type { SceneSize } from "@/app/(mywebsite)/projects/canopy/scene-loop";
import { DEFAULT_WIND } from "@/app/(mywebsite)/projects/canopy/wind";
import { isNarrow, willowGrowth, willowHanging, willowSeeds } from "./composition";

const TREE_SEED = 2208;

const WILLOW_INK: StrandInk = {
    bands: 8,
    rootDensity: 1,
    tipDensity: 0.14,
    backDensity: 0.34,
    strandWidth: 1.4,
    leafWidth: 2.3,
    leafRate: 0.14,
    leafLength: [7, 12],
    leafTilt: [0.3, 0.75],
};

type Tuft = { node: number; dx: number; dy: number; angle: number; length: number };

/** Short leafy sprays along the thin swaying wood, hanging mostly downward. */
function placeTufts(random: Random, arbor: Arbor, floor: number): Tuft[] {
    const tufts: Tuft[] = [];
    arbor.nodes.forEach((node, index) => {
        if (node.flex === 0 || node.y > floor || random() > 0.55) return;
        tufts.push({ node: index, dx: between(random, -3, 3), dy: between(random, -1, 3), angle: between(random, -0.75, 0.75), length: between(random, 5, 10) });
    });
    return tufts;
}

function paintTufts(ctx: CanvasRenderingContext2D, tufts: Tuft[], locate: NodeLocator) {
    const point = { x: 0, y: 0 };
    ctx.strokeStyle = "#ff0000";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (const tuft of tufts) {
        locate(tuft.node, point);
        const x = point.x + tuft.dx;
        const y = point.y + tuft.dy;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(tuft.angle) * tuft.length, y + Math.cos(tuft.angle) * tuft.length);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/** A faint tonal mass under the crown, so the canopy reads as deep foliage rather than a few lines. */
function paintCrownShade(ctx: CanvasRenderingContext2D, arbor: Arbor, size: SceneSize) {
    const random = seededRandom(3);
    for (let i = 0; i < size.width / 7; i++) {
        const node = arbor.nodes[Math.floor(random() * arbor.nodes.length)];
        if (node.y > size.height * 0.28 || node.flex === 0) continue;
        const radius = between(random, 22, 60);
        const centreY = node.y + radius * 0.4;
        const glow = ctx.createRadialGradient(node.x, centreY, 0, node.x, centreY, radius);
        glow.addColorStop(0, `rgba(255, 0, 0, ${between(random, 0.05, 0.13)})`);
        glow.addColorStop(1, "rgba(255, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(node.x - radius, centreY - radius, radius * 2, radius * 2);
    }
}

function buildWillow(size: SceneSize): CanopyLayout {
    const random = seededRandom(TREE_SEED);
    const arbor = growArbor(random, willowSeeds(size.width, size.height), willowGrowth(size.width, size.height));
    const strands = chooseHangingStrands(random, arbor, size.width, size.height, willowHanging(size.width, size.height));
    const curtain = createCurtain(strands);
    const paintStrands = createStrandPainter(random, curtain, strands, WILLOW_INK);
    const paintSwayingWood = createSwayingWoodPainter(arbor);
    const tufts = placeTufts(random, arbor, size.height * 0.36);
    return {
        arbor,
        curtain,
        perches: { minWidth: 2.2, maxWidth: 40, maxTilt: 0.5, spacing: 26, area: { left: 16, top: 20, right: size.width - 16, bottom: size.height * 0.34 } },
        paintStatic(ctx, paint) {
            paintCrownShade(ctx, arbor, size);
            paintStillWood(ctx, arbor, paint.locate);
        },
        paintMoving(ctx, paint) {
            paintStrands(ctx);
            paintSwayingWood(ctx, paint.locate);
            paintTufts(ctx, tufts, paint.locate);
        },
    };
}

/** Black-ink weeping willow on paper: thick limbs, arching branches and a curtain of whips. */
export const INK_WILLOW: CanopyLook = {
    wind: { ...DEFAULT_WIND, gustLean: [0.08, 0.17], secondsBetweenGusts: [3.5, 7.5] },
    palettes: {
        light: { ink: [36, 32, 29], blush: [36, 32, 29], bloom: [36, 32, 29] },
        dark: { ink: [205, 197, 186], blush: [205, 197, 186], bloom: [205, 197, 186] },
    },
    build: buildWillow,
    flockSize: (size) => Math.round(Math.min(34, Math.max(12, size.width / (isNarrow(size.width) ? 30 : 42)))),
    flightFloor: 0.42,
};
