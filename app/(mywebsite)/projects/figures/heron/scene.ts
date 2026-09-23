import type { FacetSample } from "../kit/paired-masks";
import { buildCorridor, corridorCell, type CorridorGrid } from "./corridor";
import { fieldToCanvasX, fieldToCanvasY, heronLayout, insideField, type HeronLayout } from "./field-layout";
import { ROBOT_INCHES, STEP_NAMES, TILES_PER_SIDE } from "./autonomous-path";
import { createRobotState, type RobotState } from "./timeline";

export type RobotPixels = { x: number; y: number; cos: number; sin: number; half: number };

export type HeronScene = {
    layout: HeronLayout | null;
    grid: CorridorGrid | null;
    robot: RobotState;
    pixels: RobotPixels;
};

const OUTSIDE_DENSITY = 0.04;
const OUTSIDE_BRIGHTNESS = 0.55;
const LIGHT_TILE_DENSITY = 0.3;
const DARK_TILE_DENSITY = 0.07;
const TILE_BRIGHTNESS = 0.65;
const TRAIL_IDLE_BRIGHTNESS = 2;
const TRAIL_LIT_BRIGHTNESS = 4.5;
const ROBOT_BRIGHTNESS = 5;

export const createHeronScene = (): HeronScene => ({
    layout: null,
    grid: null,
    robot: createRobotState(),
    pixels: { x: 0, y: 0, cos: 1, sin: 0, half: 1 },
});

export const fitScene = (scene: HeronScene, w: number, h: number, cell: number) => {
    if (scene.layout && scene.layout.w === w && scene.layout.h === h) return;
    scene.layout = heronLayout(w, h, STEP_NAMES.length);
    scene.grid = buildCorridor(scene.layout, cell);
};

export const placeRobotPixels = (scene: HeronScene) => {
    const layout = scene.layout;
    if (!layout) return;
    const radians = (scene.robot.heading * Math.PI) / 180;
    scene.pixels.x = fieldToCanvasX(layout, scene.robot.x);
    scene.pixels.y = fieldToCanvasY(layout, scene.robot.y);
    scene.pixels.cos = Math.cos(radians);
    scene.pixels.sin = -Math.sin(radians);
    scene.pixels.half = (ROBOT_INCHES / 2) * layout.scale;
};

export const insideRobot = (p: RobotPixels, x: number, y: number) => {
    const dx = x - p.x, dy = y - p.y;
    const forward = dx * p.cos + dy * p.sin;
    const side = -dx * p.sin + dy * p.cos;
    return Math.abs(forward) <= p.half && Math.abs(side) <= p.half;
};

const onSeam = (layout: HeronLayout, x: number, y: number) => {
    const tile = layout.size / TILES_PER_SIDE;
    const u = (x - layout.left) % tile, v = (y - layout.top) % tile;
    return Math.min(u, tile - u, v, tile - v) < layout.seamClearance;
};

const tileDensity = (layout: HeronLayout, x: number, y: number) => {
    const tile = layout.size / TILES_PER_SIDE;
    const parity = (Math.floor((x - layout.left) / tile) + Math.floor((y - layout.top) / tile)) & 1;
    return parity ? LIGHT_TILE_DENSITY : DARK_TILE_DENSITY;
};

const sampleOutside = (layout: HeronLayout, x: number, y: number, out: FacetSample) => {
    const q = layout.quietZone;
    const quiet = layout.wide && x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h;
    out.density = quiet ? 0 : OUTSIDE_DENSITY;
    out.brightness = OUTSIDE_BRIGHTNESS;
};

const trailBrightness = (scene: HeronScene, grid: CorridorGrid, index: number) => {
    const piece = grid.piece[index];
    const travelled = grid.along[index] <= scene.robot.lit[piece];
    if (!travelled) return TRAIL_IDLE_BRIGHTNESS;
    const strength = scene.robot.trailStrength;
    return TRAIL_IDLE_BRIGHTNESS + (TRAIL_LIT_BRIGHTNESS - TRAIL_IDLE_BRIGHTNESS) * strength;
};

export const sampleHeron = (scene: HeronScene, x: number, y: number, out: FacetSample) => {
    const { layout, grid } = scene;
    if (!layout || !grid) return;
    if (!insideField(layout, x, y)) { sampleOutside(layout, x, y, out); return; }
    if (insideRobot(scene.pixels, x, y)) {
        out.density = scene.robot.alpha;
        out.brightness = ROBOT_BRIGHTNESS;
        return;
    }
    const tile = onSeam(layout, x, y) ? 0 : tileDensity(layout, x, y);
    out.density = tile;
    out.brightness = TILE_BRIGHTNESS;
    const index = corridorCell(grid, x, y);
    if (index < 0 || grid.strength[index] <= 0) return;
    out.density = Math.max(tile, 0.95 * grid.strength[index]);
    out.brightness = trailBrightness(scene, grid, index);
};
