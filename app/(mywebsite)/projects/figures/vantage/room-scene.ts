import type { FacetSample } from "../kit/paired-masks";
import { createHeadCamera, swayCamera, viewRay, type Vec3 } from "./head-camera";
import { sampleFloor } from "./floor-grid";
import { ROOM_WINDOWS, hitWindow, placeWindow, projectWindow, type PlacedWindow, type WindowHit } from "./room-windows";
import { windowTexture } from "./window-content";

const AIR_DENSITY = 0.03;
const AIR_BRIGHTNESS = 0.5;

export type RoomScene = {
    camera: ReturnType<typeof createHeadCamera>;
    windows: PlacedWindow[];
    cell: number;
    ray: Vec3;
    hit: WindowHit;
};

export const createRoomScene = (cell: number): RoomScene => ({
    camera: createHeadCamera(),
    windows: ROOM_WINDOWS.map(placeWindow),
    cell,
    ray: { x: 0, y: 0, z: 1 },
    hit: { t: Infinity, u: 0, v: 0 },
});

export const advanceRoom = (scene: RoomScene, w: number, h: number, t: number) => {
    swayCamera(scene.camera, w, h, t);
    scene.windows.forEach((placed) => projectWindow(placed, scene.camera));
};

const nearestWindow = (scene: RoomScene, x: number, y: number) => {
    let found: PlacedWindow | null = null;
    scene.hit.t = Infinity;
    for (const placed of scene.windows) {
        if (x < placed.minX || x > placed.maxX || y < placed.minY || y > placed.maxY) continue;
        if (hitWindow(placed, scene.camera, scene.ray, scene.hit)) found = placed;
    }
    return found;
};

export const sampleRoom = (scene: RoomScene, x: number, y: number, out: FacetSample) => {
    out.density = AIR_DENSITY;
    out.brightness = AIR_BRIGHTNESS;
    viewRay(scene.camera, x, y, scene.ray);
    const placed = nearestWindow(scene, x, y);
    if (placed) { windowTexture(placed.spec, scene.hit.u, scene.hit.v, out); return; }
    sampleFloor(scene.camera, scene.ray, scene.cell, out);
};
