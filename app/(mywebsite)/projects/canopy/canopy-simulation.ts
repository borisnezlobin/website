import { createWoodLean } from "./arbor/sway";
import { createFlock, type Flock } from "./boids/flock";
import type { CanopyLayout, CanopyLook, PaintContext } from "./canopy-engine";
import { findPerches } from "./perches";
import type { Random } from "./random";
import type { Pointer, SceneSize } from "./scene-loop";
import { createWind } from "./wind";

export type Stage = { layout: CanopyLayout; paint: PaintContext; staticLayer: HTMLCanvasElement };

const SETTLE_SECONDS = 2;

/** Wind, the leaning wood, the hanging strands and the flock, advanced together in fixed steps. */
export function createSimulation(look: CanopyLook, random: Random) {
    const wind = createWind(random, look.wind);
    const woodLean = createWoodLean();
    let flock: Flock | null = null;

    const settle = (stage: Stage, size: SceneSize) => {
        wind.resize(size.width);
        woodLean.resize(size.width);
        for (let elapsed = 0; elapsed < SETTLE_SECONDS; elapsed += 1 / 60) woodLean.step(1 / 60, wind.woodLean);
        const anchor = { x: 0, y: 0 };
        stage.layout.curtain.prime(wind.lean, (strand) => stage.paint.locate(stage.layout.curtain.specs[strand].node, anchor).x);
        const perches = findPerches(stage.layout.arbor, stage.paint.locate, stage.layout.perches);
        flock ??= createFlock(random, { count: look.flockSize(size), floor: look.flightFloor });
        flock.setPerches(perches, size.width, stage.layout.reach ?? size.height);
    };

    const step = (stage: Stage, dt: number, pointer: Pointer) => {
        wind.update(dt);
        woodLean.step(dt, wind.woodLean);
        stage.layout.curtain.step(dt, wind.lean);
        stage.layout.curtain.brush(pointer, dt);
        stage.layout.step?.(dt, wind, stage.paint);
        flock?.update(dt, pointer);
    };

    return {
        woodLean,
        settle,
        step,
        get flock() {
            return flock;
        },
    };
}
