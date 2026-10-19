import { advanceBed, paintBed, STEPS_PER_SECOND, stirFromPointer, type CreekBed } from "./creek-bed";
import { createFloatingLink, type FloatingLayerSource } from "./floating-layer";
import { stepsFor } from "./flow-grid";
import { createGrainTile, drawGrain } from "./grain";
import { creekPalette, type CreekPalette } from "./palette";
import {
    createFrameLoop, fitCanvas, isDarkMode, prefersReducedMotion, trackPointer, watchDarkMode, watchResize,
    type CanvasSize, type FrameLoop,
} from "./stage";

/**
 * The loop every creek direction runs: build the world for the canvas size, warm the water up so
 * the first frame already flows, then each frame stir, step the floats, step the water and paint.
 * A direction only supplies what is drawn on top of the shared bed. Under reduced motion it paints
 * one well-developed frame and stops.
 */
export type Look = { palette: CreekPalette; dark: boolean; grain: HTMLCanvasElement; version: number };

export type CreekWorld = { bed: CreekBed };

export type CreekScene<World extends CreekWorld> = {
    build: (size: CanvasSize, ctx: CanvasRenderingContext2D) => World;
    advance: (world: World, steps: number, delta: number, time: number) => void;
    /** Draws over the painted bed; `look.version` changes whenever the theme does. */
    paint: (ctx: CanvasRenderingContext2D, world: World, look: Look, time: number) => void;
};

export type CreekEngineOptions = { floats?: FloatingLayerSource; warmUpSteps?: number };

const WARM_UP_STEPS = 2400;
const STILL_WARM_UP_STEPS = 3600;
const WARM_UP_CHUNK = 6;
const FACET_REPAINT_SECONDS = 0.08;

function warmUp<World extends CreekWorld>(scene: CreekScene<World>, world: World, steps: number) {
    const delta = WARM_UP_CHUNK / STEPS_PER_SECOND;
    for (let s = 0; s < steps; s += WARM_UP_CHUNK) {
        advanceBed(world.bed, WARM_UP_CHUNK, delta);
        scene.advance(world, WARM_UP_CHUNK, delta, s / STEPS_PER_SECOND);
    }
}

export function runCreekEngine<World extends CreekWorld>(canvas: HTMLCanvasElement, scene: CreekScene<World>, options: CreekEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dispose: () => { } };
    const still = prefersReducedMotion();
    const look: Look = { dark: isDarkMode(), palette: creekPalette(isDarkMode()), grain: createGrainTile(), version: 0 };
    const build = () => {
        const world = scene.build(fitCanvas(canvas), ctx);
        warmUp(scene, world, still ? STILL_WARM_UP_STEPS : options.warmUpSteps ?? WARM_UP_STEPS);
        return world;
    };
    let world = build();
    let lastFacetPaint = -1;
    const carry = { value: 0 };
    const floats = createFloatingLink(options.floats);

    const paintFacets = (time: number) => { world.bed.facets.paint(time, look.palette.facets); lastFacetPaint = time; };
    const paint = (time: number) => {
        paintBed(ctx, world.bed, look.palette);
        scene.paint(ctx, world, look, time);
        drawGrain(ctx, look.grain, world.bed.size.width, world.bed.size.height, look.dark);
    };
    const redraw = (time: number) => { paintFacets(time); paint(time); };
    redraw(0);

    const stopTheme = watchDarkMode((dark) => {
        Object.assign(look, { dark, palette: creekPalette(dark), version: look.version + 1 });
        redraw(lastFacetPaint);
    });
    const stopResize = watchResize(canvas, () => { world = build(); look.version++; redraw(lastFacetPaint); });
    const pointer = trackPointer(canvas);
    const loop: FrameLoop | null = still ? null : createFrameLoop(canvas, (time, delta) => {
        const steps = stepsFor(delta, STEPS_PER_SECOND, carry);
        stirFromPointer(world.bed, pointer, steps);
        floats.step(world.bed.probe, time, delta);
        advanceBed(world.bed, steps, delta);
        scene.advance(world, steps, delta, time);
        if (time - lastFacetPaint > FACET_REPAINT_SECONDS) paintFacets(time);
        paint(time);
    });

    return {
        dispose: () => {
            loop?.dispose();
            pointer.dispose();
            stopTheme();
            stopResize();
        },
    };
}
