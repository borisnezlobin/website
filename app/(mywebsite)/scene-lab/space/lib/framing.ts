import { Vector3, type PerspectiveCamera } from "three";
import type { PolyPlacement } from "./polyhedron-actor";
import type { WhaleRoute } from "./whale-actor";

export const FOV = 38;
export const LOOK_AT = new Vector3(0, 0, -12);
const MIN_DISTANCE = 54;
/** Narrow screens pull the camera back until about 34 m fits across at z = 0. */
const MIN_HALF_WIDTH = 17;

export function cameraDistance(aspect: number) {
    return Math.max(MIN_DISTANCE, MIN_HALF_WIDTH / (Math.tan(((FOV / 2) * Math.PI) / 180) * aspect));
}

export function halfHeightAt(camera: PerspectiveCamera, depth: number) {
    return (camera.position.z - depth) * Math.tan(((camera.fov / 2) * Math.PI) / 180);
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Near, middle and far whales, so depth reads from size and parallax alone. */
export function whaleRoutes(aspect: number): WhaleRoute[] {
    const stretch = Math.min(1.25, Math.max(0.5, aspect / 1.6));
    return [
        { center: v(-1, -4, 12), radius: v(13 * stretch, 1.4, 3.5), speed: 0.075, phase: 2.6, rollAmplitude: 0.32, rollRate: 0.23 },
        { center: v(-6, 9, -22), radius: v(24 * stretch, 2.2, 5), speed: -0.055, phase: 0.6, rollAmplitude: 0.45, rollRate: 0.17 },
        { center: v(12, -10, -64), radius: v(36 * stretch, 3, 7), speed: 0.045, phase: 4.1, rollAmplitude: 0.7, rollRate: 0.13 },
    ];
}

const spin = (x: number, y: number, z: number) => v(x, y, z).multiplyScalar(0.16);

/** Fewer, more deliberate solids: one big near star cropped by the frame, mid-depth clusters, small far stars. */
export const POLY_PLACEMENTS: PolyPlacement[] = [
    { kind: "star", frame: { x: -0.78, y: 0.5 }, depth: 4, size: 2.7, spin: spin(0.3, 0.8, 0.1), driftPhase: 0.3 },
    { kind: "cluster", frame: { x: 0.62, y: 0.5 }, depth: -12, size: 4.6, spin: spin(-0.2, 0.6, 0.3), driftPhase: 1.7 },
    { kind: "star", frame: { x: 0.74, y: -0.48 }, depth: 12, size: 2.1, spin: spin(0.4, -0.5, 0.2), driftPhase: 2.9 },
    { kind: "quad", frame: { x: -0.34, y: -0.6 }, depth: -18, size: 4.4, spin: spin(0.1, -0.5, 0.3), driftPhase: 4.2 },
    { kind: "star", frame: { x: 0.08, y: 0.72 }, depth: -40, size: 3.2, spin: spin(0.5, 0.3, -0.3), driftPhase: 5.1 },
    { kind: "star", frame: { x: 0.36, y: -0.04 }, depth: -64, size: 3.6, spin: spin(0.2, 0.5, 0.4), driftPhase: 3.3 },
    { kind: "cluster", frame: { x: -0.6, y: 0.12 }, depth: -78, size: 6.5, spin: spin(-0.3, -0.4, 0.2), driftPhase: 2.2 },
    { kind: "star", frame: { x: 1.06, y: -0.86 }, depth: 32, size: 3.4, spin: spin(0.2, -0.6, 0.3), driftPhase: 4.8 },
    { kind: "star", frame: { x: -0.12, y: -0.24 }, depth: -100, size: 3.0, spin: spin(0.6, 0.2, 0.1), driftPhase: 0.9 },
];
