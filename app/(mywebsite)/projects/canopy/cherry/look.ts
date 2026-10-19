import { growArbor } from "../arbor/growth";
import type { CanopyLayout, CanopyLook } from "../canopy-engine";
import { createCurtain } from "../curtain";
import { chooseHangingStrands } from "../hanging";
import { createStrandPainter, type StrandInk } from "../ink/strands";
import { createSwayingWoodPainter, paintStillWood } from "../ink/wood";
import { createPetals } from "../petals";
import { seededRandom } from "../random";
import { DEFAULT_WIND } from "../wind";
import type { SceneSize } from "../scene-loop";
import { petalOrigin, placeBlossoms, stampBlossoms } from "./blossoms";
import { cherryGrowth, cherryHanging, cherrySeeds, isNarrow } from "./composition";

const TREE_SEED = 1903;

const WHIP_INK: StrandInk = {
    bands: 6,
    rootDensity: 0.72,
    tipDensity: 0.22,
    backDensity: 0.55,
    strandWidth: 1.1,
    leafWidth: 0,
    leafRate: 0,
    leafLength: [0, 0],
    leafTilt: [0, 0],
};

/** The deepest whip tips (the hemline plus the extra drop at the screen edges) end this far down. */
const DEEPEST_SHARE = 0.52;
const PETAL_FADE_SHARES = { from: 0.5, to: 0.74 };

/**
 * The wood keeps its usual proportions unless that would hang the tree below the floor, when it
 * is composed shorter. The whips always hang down to the floor, or to their usual depth without one.
 */
function cherryReach(size: SceneSize, floor: number | undefined) {
    const hangFloor = floor ?? size.height * DEEPEST_SHARE;
    const whips = hangFloor / DEEPEST_SHARE;
    const petalFade = { from: Math.min(size.height, whips) * PETAL_FADE_SHARES.from, to: floor ?? size.height * PETAL_FADE_SHARES.to };
    return { wood: Math.min(size.height, whips), whips, petalFade };
}

function buildCherry(size: SceneSize, floor?: number): CanopyLayout {
    const { width } = size;
    const { wood: reach, whips, petalFade } = cherryReach(size, floor);
    const random = seededRandom(TREE_SEED);
    const arbor = growArbor(random, cherrySeeds(width, reach), cherryGrowth(width, reach));
    const strands = chooseHangingStrands(random, arbor, width, whips, cherryHanging(width, whips));
    const curtain = createCurtain(strands);
    const paintWhips = createStrandPainter(random, curtain, strands, WHIP_INK);
    const paintSwayingWood = createSwayingWoodPainter(arbor);
    const blossoms = placeBlossoms(random, arbor, curtain, reach * 0.32, whips / reach);
    const petals = createPetals(seededRandom(8), petalFade);
    const petalRandom = seededRandom(13);
    petals.scatter(Math.round(width / 160), width, reach * 0.12, reach * 0.5);
    return {
        arbor,
        curtain,
        reach,
        perches: { minWidth: 2.4, maxWidth: 44, maxTilt: 0.5, spacing: 26, area: { left: 16, top: 20, right: width - 16, bottom: reach * 0.3 } },
        paintStatic(ctx, paint) {
            paintStillWood(ctx, arbor, paint.locate);
        },
        paintMoving(ctx, paint) {
            paintWhips(ctx);
            paintSwayingWood(ctx, paint.locate);
            petals.paint(ctx);
        },
        stamp(pixels, paint) {
            stampBlossoms(pixels, blossoms, curtain, paint.locate);
        },
        step(dt, wind) {
            petals.update(dt, wind, (out) => petalOrigin(petalRandom, blossoms, curtain, out));
        },
    };
}

/** A dithered shidare-zakura: ink limbs, whips strung with red and blush flowers, and drifting petals. */
export const WEEPING_CHERRY: CanopyLook = {
    wind: { ...DEFAULT_WIND, breeze: 0.03, gustLean: [0.08, 0.16], secondsBetweenGusts: [4, 8] },
    palettes: {
        light: { ink: [38, 33, 30], blush: [232, 162, 164], bloom: [204, 42, 38] },
        dark: { ink: [150, 141, 131], blush: [156, 90, 94], bloom: [233, 100, 87] },
    },
    build: buildCherry,
    flockSize: (size) => Math.round(Math.min(30, Math.max(10, size.width / (isNarrow(size.width) ? 32 : 46)))),
    flightFloor: 0.42,
};
