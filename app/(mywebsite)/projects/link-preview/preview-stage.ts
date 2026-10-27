import { createNodeLocator, createWoodLean } from "../canopy/arbor/sway";
import type { Point } from "../canopy/boids/types";
import { restingSpot } from "../canopy/boids/landing";
import type { PaintContext } from "../canopy/canopy-engine";
import type { BlossomSet } from "../canopy/cherry/blossoms";
import { growWeepingCherry } from "../canopy/cherry/look";
import { findPerches } from "../canopy/perches";
import { seededRandom } from "../canopy/random";
import type { SceneSize } from "../canopy/scene-loop";
import { scriptBirds, type ScriptedBird } from "./bird-flight";
import { setHeadline, type Headline, type HeadlineSetting } from "./headline-tiles";
import { createLoopWind } from "./loop-wind";
import { schedulePetals, type BlossomSource, type PetalSchedule } from "./petal-schedule";
import { HEADLINES, LOOP_SECONDS, since } from "./timeline";

/** The scene is laid out like the projects page on a narrow screen, and drawn at twice its size. */
export const SCENE: SceneSize = { width: 600, height: 315, dpr: 2 };
/** The whips hang no lower than this, which leaves the bottom of the frame for the headline. */
export const TREE_FLOOR = SCENE.height * 0.6;
const STEPS_PER_SECOND = 120;
const STEP = 1 / STEPS_PER_SECOND;
const STEPS_PER_LOOP = LOOP_SECONDS * STEPS_PER_SECOND;
/** Two loops of wind before the first frame, so the strands are already on their repeating swing. */
const WARM_UP_LOOPS = 2;

export type PreviewStage = ReturnType<typeof createPreviewStage>;

function blossomPoint(blossoms: BlossomSet, paint: PaintContext, index: number, out: Point) {
    const blossom = blossoms.onStrands[index];
    paint.curtain.pointAt(blossom.host, blossom.share, out);
    out.x += blossom.dx;
    out.y += blossom.dy;
    return out;
}

/** Fills in where each petal and bird starts from, at the step its release falls in. */
function captureReleases(schedule: PetalSchedule, birds: ScriptedBird[], blossoms: BlossomSet, paint: PaintContext, loopTime: number) {
    const crossed = (at: number) => since(loopTime, at) < STEP;
    for (const petal of [...schedule.arrivals, ...schedule.drifts]) {
        if (crossed(petal.release)) blossomPoint(blossoms, paint, petal.source, petal.origin);
    }
    for (const bird of birds) {
        if (crossed(bird.takeOff)) restingSpot(bird.site, bird.facing, bird.launch);
    }
}

/**
 * The real weeping cherry on a scheduled wind. The strands and wood are simulated in fixed steps
 * (they are damped springs, so a repeating wind gives a repeating swing); the petals and birds are
 * planned up front and only read the tree at the moment they leave it.
 */
export function createPreviewStage(setting: Omit<HeadlineSetting, "fontFamily">, fontFamily: string) {
    const { layout, blossoms } = growWeepingCherry(SCENE, TREE_FLOOR, { fallingPetals: false });
    const wind = createLoopWind();
    const woodLean = createWoodLean();
    wind.resize(SCENE.width);
    woodLean.resize(SCENE.width);
    const paint: PaintContext = { locate: createNodeLocator(layout.arbor, woodLean.at), curtain: layout.curtain, size: SCENE };
    const anchor = { x: 0, y: 0 };
    const anchorPoint = (strand: number, out: Point) => paint.locate(layout.curtain.specs[strand].node, out);
    const poseCurtain = () => layout.curtain.pose(anchorPoint);

    layout.curtain.prime(wind.lean, (strand) => paint.locate(layout.curtain.specs[strand].node, anchor).x);
    poseCurtain();

    const sources: BlossomSource[] = blossoms.onStrands.map((_, index) => ({ index, rest: blossomPoint(blossoms, paint, index, { x: 0, y: 0 }) }));
    const headlines: Headline[] = HEADLINES.map((text) => setHeadline(text, SCENE, { ...setting, fontFamily }));
    const schedule = schedulePetals(seededRandom(77), headlines, sources);
    const birds = scriptBirds(seededRandom(31), findPerches(layout.arbor, paint.locate, layout.perches));

    let steps = 0;
    const step = () => {
        wind.update(STEP);
        woodLean.step(STEP, wind.woodLean);
        layout.curtain.step(STEP, wind.lean);
        steps++;
        poseCurtain();
        captureReleases(schedule, birds, blossoms, paint, (steps % STEPS_PER_LOOP) / STEPS_PER_SECOND);
    };

    /** Runs forward to the next moment that reads `loopTime` on the loop clock. */
    const advanceTo = (loopTime: number) => {
        const wanted = Math.round(loopTime * STEPS_PER_SECOND) % STEPS_PER_LOOP;
        const behind = (wanted - (steps % STEPS_PER_LOOP) + STEPS_PER_LOOP) % STEPS_PER_LOOP;
        for (let i = 0; i < behind; i++) step();
    };

    for (let i = 0; i < WARM_UP_LOOPS * STEPS_PER_LOOP; i++) step();

    return { layout, paint, headlines, schedule, birds, advanceTo, poseCurtain };
}
