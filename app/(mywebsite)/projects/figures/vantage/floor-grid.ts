import { smoothstep } from "../lib/motion";
import type { FacetSample } from "../kit/paired-masks";
import type { HeadCamera, Vec3 } from "./head-camera";

export const GRID_METRES = 0.6;
export const ROOM_HALF_WIDTH = 4.2;
export const ROOM_DEPTH = 13.2;
const FAR_FADE_METRES = 7;

const checker = (x: number, z: number) => (Math.floor(x / GRID_METRES) + Math.floor(z / GRID_METRES)) & 1;

export const floorFade = (depth: number) => Math.exp(-depth / FAR_FADE_METRES);

export const sampleFloor = (camera: HeadCamera, ray: Vec3, cell: number, out: FacetSample) => {
    if (ray.y >= -1e-4) return false;
    const t = -camera.y / ray.y;
    const x = camera.x + ray.x * t, z = camera.z + ray.z * t;
    if (Math.abs(x) > ROOM_HALF_WIDTH || z > ROOM_DEPTH || z < 0) return false;
    const tileRows = (camera.focal * camera.y * GRID_METRES) / (t * t);
    const resolved = smoothstep(cell * 1.5, cell * 3.5, tileRows);
    const near = floorFade(t);
    const tile = checker(x, z) ? 0.42 : 0.06;
    out.density = 0.03 + (tile * resolved + 0.12 * (1 - resolved)) * near;
    out.brightness = 0.45 + 1.4 * near;
    return true;
};
