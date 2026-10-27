import type { Arbor } from "./arbor/growth";
import { createNodeLocator, type NodeLocator } from "./arbor/sway";
import { BIRD_COLORS, BIRD_EDGES, drawBirds } from "./boids/draw";
import type { Point } from "./boids/types";
import { createSimulation, type Stage } from "./canopy-simulation";
import type { Curtain } from "./curtain";
import { CELL, createDitherSurface, type DensityPixels, type DitherPalette } from "./dither/surface";
import { fadePaperBottom, makeCanvas, paintPaperTexture, PAPER_TONES } from "./paper";
import type { PerchCriteria } from "./perches";
import { seededRandom } from "./random";
import { runScene, trackPointer, type SceneSize } from "./scene-loop";
import type { Wind, WindOptions } from "./wind";

export type PaintContext = { locate: NodeLocator; curtain: Curtain; size: SceneSize };

/** One composed tree for one screen size: its wood, its hanging strands and how to paint them. */
export type CanopyLayout = {
    arbor: Arbor;
    curtain: Curtain;
    perches: PerchCriteria;
    /** The height the tree was composed for, when it had to stay shorter than the canvas. */
    reach?: number;
    /** Density that never moves (thick limbs, shade), painted once in CSS px. */
    paintStatic(ctx: CanvasRenderingContext2D, paint: PaintContext): void;
    /** Density that moves, painted every frame in CSS px. */
    paintMoving(ctx: CanvasRenderingContext2D, paint: PaintContext): void;
    /** Writes straight into the density pixels after the canvas pass, for marks too many to draw as paths. */
    stamp?(pixels: DensityPixels, paint: PaintContext): void;
    step?(dt: number, wind: Wind, paint: PaintContext): void;
};

export type CanopyLook = {
    wind: WindOptions;
    palettes: Record<"light" | "dark", DitherPalette>;
    /** `floor`, when given, is the lowest point in CSS px from the top that the tree should hang down to and never pass. */
    build(size: SceneSize, floor?: number): CanopyLayout;
    flockSize(size: SceneSize): number;
    /** Lowest a flying bird should roam, as a share of the height. */
    flightFloor: number;
};

export type CanopyOptions = {
    /** Keeps the tree above this line, so whatever sits on the canvas below it stays readable. */
    floor?: (size: SceneSize) => number;
};

/** `relayout` rebuilds the tree at the same size, for when its floor has moved. */
export type Canopy = { relayout(): void; dispose(): void };

/** Shares of the height over which the paper texture thins into the page; below that the page is plain. */
const PAPER_FADE = { from: 0.5, to: 0.78 } as const;

const sameSize = (a: SceneSize, b: SceneSize) => a.width === b.width && a.height === b.height && a.dpr === b.dpr;

export function paintStaticLayer(layout: CanopyLayout, paint: PaintContext) {
    const layer = makeCanvas(paint.size.width / CELL, paint.size.height / CELL);
    const ctx = layer.getContext("2d")!;
    ctx.scale(1 / CELL, 1 / CELL);
    layout.paintStatic(ctx, paint);
    return layer;
}

export function paintPaperLayer(size: SceneSize, dark: boolean) {
    const paper = makeCanvas(size.width * size.dpr, size.height * size.dpr);
    const ctx = paper.getContext("2d")!;
    ctx.scale(size.dpr, size.dpr);
    paintPaperTexture(ctx, size.width, size.height, dark ? PAPER_TONES.dark : PAPER_TONES.light);
    fadePaperBottom(ctx, size.width, size.height, PAPER_FADE.from, PAPER_FADE.to);
    return paper;
}

/** Runs a dithered canopy: paper grain, a Bayer-dithered tree that sways, and crisp perching birds on top. */
export function createCanopy(canvas: HTMLCanvasElement, look: CanopyLook, options: CanopyOptions = {}): Canopy | null {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const simulation = createSimulation(look, seededRandom(51));
    const surface = createDitherSurface();
    const { pointer, dispose: stopPointer } = trackPointer(canvas);
    let size: SceneSize = { width: 0, height: 0, dpr: 1 };
    let dark = false;
    let stage: Stage | null = null;
    let paper: HTMLCanvasElement | null = null;

    const anchorPoint = (strand: number, out: Point) => stage!.paint.locate(stage!.layout.curtain.specs[strand].node, out);

    const composeDensity = ({ layout, paint, staticLayer }: Stage) => {
        const density = surface.begin();
        density.setTransform(1, 0, 0, 1, 0, 0);
        density.drawImage(staticLayer, 0, 0);
        density.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
        layout.curtain.pose(anchorPoint);
        layout.paintMoving(density, paint);
        return surface.finish(layout.stamp && ((pixels) => layout.stamp!(pixels, paint)));
    };

    const draw = () => {
        if (!stage || !paper) return;
        const dithered = composeDensity(stage);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(paper, 0, 0);
        ctx.drawImage(dithered, 0, 0, dithered.width * CELL * size.dpr, dithered.height * CELL * size.dpr);
        ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        const tone = dark ? "dark" : "light";
        if (simulation.flock) drawBirds(ctx, simulation.flock.birds, BIRD_COLORS[tone], BIRD_EDGES[tone]);
    };

    const resize = (next: SceneSize, force = false) => {
        if (sameSize(size, next) && stage && !force) return;
        size = next;
        const layout = look.build(size, options.floor?.(size));
        const paint: PaintContext = { locate: createNodeLocator(layout.arbor, simulation.woodLean.at), curtain: layout.curtain, size };
        stage = { layout, paint, staticLayer: paintStaticLayer(layout, paint) };
        surface.resize(size);
        paper = paintPaperLayer(size, dark);
        simulation.settle(stage, size);
    };

    const theme = (nextDark: boolean) => {
        dark = nextDark;
        surface.setPalette(dark ? look.palettes.dark : look.palettes.light);
        if (size.width) paper = paintPaperLayer(size, dark);
    };

    const scene = runScene(canvas, {
        resize,
        theme,
        step: (dt) => stage && simulation.step(stage, dt, pointer),
        draw,
        still() {
            simulation.flock?.perchEveryone();
            draw();
        },
    });

    return {
        relayout() {
            if (!size.width) return;
            resize(size, true);
            scene.redraw();
        },
        dispose() {
            scene.dispose();
            stopPointer();
        },
    };
}
