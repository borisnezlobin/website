import { BIRD_COLORS, BIRD_EDGES, drawBirds, type BirdPose } from "../canopy/boids/draw";
import { paintPaperLayer, paintStaticLayer } from "../canopy/canopy-engine";
import { WEEPING_CHERRY } from "../canopy/cherry/look";
import { CELL, createDitherSurface } from "../canopy/dither/surface";
import { clamp } from "../canopy/random";
import { birdPose } from "./bird-flight";
import { paintTile, type Tile } from "./headline-tiles";
import { arrivalPose, departurePose, driftPose, DEPART_SECONDS, paintPetal, type PetalPose } from "./petal-flight";
import { SCENE, TREE_FLOOR, type PreviewStage } from "./preview-stage";
import { since } from "./timeline";

const PAGE_BACKGROUND = "#f5f5f5";
/** Petals falling between headlines dissolve over this band, so they never land on the words. */
const DRIFT_FADE = { from: TREE_FLOOR * 0.8, to: TREE_FLOOR + 24 };
const CENTRE = { x: SCENE.width / 2, y: SCENE.height / 2 };

/** For each tile, the moment the gust carries it off again, so a landed tile knows how long it stays. */
function liftoffTimes(stage: PreviewStage) {
    const liftoffs = new Map<Tile, number>();
    for (const departure of stage.schedule.departures) liftoffs.set(departure.tile, departure.liftoff);
    return liftoffs;
}

/** Composes loop second `t` onto a canvas sized SCENE x dpr: paper, the dithered tree and words, then the birds. */
export function createPreviewPainter(stage: PreviewStage, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    const surface = createDitherSurface();
    surface.resize(SCENE);
    surface.setPalette(WEEPING_CHERRY.palettes.light);
    const staticLayer = paintStaticLayer(stage.layout, stage.paint);
    const paper = paintPaperLayer(SCENE, false);
    const liftoffs = liftoffTimes(stage);
    const pose: PetalPose = { x: 0, y: 0, spin: 0, flip: 0, radius: 0 };
    const birds: BirdPose[] = stage.birds.map(() => ({ x: 0, y: 0, heading: 0, stretch: 1 }));

    const paintLandedTiles = (density: CanvasRenderingContext2D, t: number) => {
        for (const arrival of stage.schedule.arrivals) {
            const stays = since(liftoffs.get(arrival.tile) ?? arrival.land, arrival.land);
            if (since(t, arrival.land) < stays) paintTile(density, stage.headlines[arrival.headline], arrival.tile);
        }
    };

    const paintFlyingPetals = (density: CanvasRenderingContext2D, t: number) => {
        for (const arrival of stage.schedule.arrivals) {
            const age = since(t, arrival.release);
            if (age < arrival.land - arrival.release) paintPetal(density, arrivalPose(arrival, age, CENTRE, pose));
        }
        for (const departure of stage.schedule.departures) {
            const age = since(t, departure.liftoff);
            if (age < DEPART_SECONDS) paintPetal(density, departurePose(departure, age, CENTRE, pose));
        }
        for (const drift of stage.schedule.drifts) {
            driftPose(drift, since(t, drift.release), pose);
            const alpha = clamp((DRIFT_FADE.to - pose.y) / (DRIFT_FADE.to - DRIFT_FADE.from), 0, 1);
            if (alpha > 0) paintPetal(density, pose, 0.95 * alpha);
        }
        density.globalAlpha = 1;
        density.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
    };

    const composeDensity = (t: number) => {
        const density = surface.begin();
        density.setTransform(1, 0, 0, 1, 0, 0);
        density.drawImage(staticLayer, 0, 0);
        density.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
        stage.poseCurtain();
        stage.layout.paintMoving(density, stage.paint);
        paintLandedTiles(density, t);
        paintFlyingPetals(density, t);
        return surface.finish((pixels) => stage.layout.stamp?.(pixels, stage.paint));
    };

    return (t: number) => {
        stage.advanceTo(t);
        const dithered = composeDensity(t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = PAGE_BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(paper, 0, 0);
        ctx.drawImage(dithered, 0, 0, dithered.width * CELL * SCENE.dpr, dithered.height * CELL * SCENE.dpr);
        ctx.setTransform(SCENE.dpr, 0, 0, SCENE.dpr, 0, 0);
        stage.birds.forEach((bird, index) => birdPose(bird, SCENE, t, birds[index]));
        drawBirds(ctx, birds, BIRD_COLORS.light, BIRD_EDGES.light);
    };
}
