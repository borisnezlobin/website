import { project, type HeadCamera, type Vec3 } from "./head-camera";

export type WindowContent = "sidebar" | "list" | "plain";

export type RoomWindow = {
    centre: Vec3;
    width: number;
    height: number;
    turnDegrees: number;
    content: WindowContent;
};

export type PlacedWindow = {
    spec: RoomWindow;
    right: Vec3;
    normal: Vec3;
    corners: { x: number; y: number }[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    reach: number;
};

export const TITLE_BAR_METRES = 0.09;

export const ROOM_WINDOWS: RoomWindow[] = [
    { centre: { x: 0.5, y: 2.2, z: 6.6 }, width: 0.95, height: 0.6, turnDegrees: -6, content: "plain" },
    { centre: { x: -0.95, y: 1.5, z: 3.6 }, width: 1.7, height: 1.0, turnDegrees: 20, content: "sidebar" },
    { centre: { x: 1.3, y: 1.45, z: 3.2 }, width: 0.62, height: 1.2, turnDegrees: -24, content: "list" },
];

const CORNER_SIGNS = [[-1, 1], [1, 1], [1, -1], [-1, -1]];

export const windowPoint = (placed: PlacedWindow, u: number, v: number): Vec3 => {
    const { centre, width, height } = placed.spec;
    const across = (u - 0.5) * width, up = (0.5 - v) * height;
    return {
        x: centre.x + placed.right.x * across,
        y: centre.y + up,
        z: centre.z + placed.right.z * across,
    };
};

export const placeWindow = (spec: RoomWindow): PlacedWindow => {
    const turn = (spec.turnDegrees * Math.PI) / 180;
    return {
        spec,
        right: { x: Math.cos(turn), y: 0, z: Math.sin(turn) },
        normal: { x: Math.sin(turn), y: 0, z: -Math.cos(turn) },
        corners: CORNER_SIGNS.map(() => ({ x: 0, y: 0 })),
        minX: 0, maxX: 0, minY: 0, maxY: 0, reach: 0,
    };
};

export const projectWindow = (placed: PlacedWindow, camera: HeadCamera) => {
    CORNER_SIGNS.forEach(([su, sv], k) => project(camera, windowPoint(placed, (su + 1) / 2, (1 - sv) / 2), placed.corners[k]));
    const xs = placed.corners.map((c) => c.x), ys = placed.corners.map((c) => c.y);
    placed.minX = Math.min(...xs);
    placed.maxX = Math.max(...xs);
    placed.minY = Math.min(...ys);
    placed.maxY = Math.max(...ys);
    const { centre } = placed.spec, n = placed.normal;
    placed.reach = (centre.x - camera.x) * n.x + (centre.y - camera.y) * n.y + (centre.z - camera.z) * n.z;
};

export type WindowHit = { t: number; u: number; v: number };

export const hitWindow = (placed: PlacedWindow, camera: HeadCamera, ray: Vec3, hit: WindowHit) => {
    const n = placed.normal;
    const facing = ray.x * n.x + ray.y * n.y + ray.z * n.z;
    if (facing >= 0) return false;
    const t = placed.reach / facing;
    if (t <= 0 || t >= hit.t) return false;
    const { centre, width, height } = placed.spec;
    const px = camera.x + ray.x * t - centre.x, py = camera.y + ray.y * t - centre.y, pz = camera.z + ray.z * t - centre.z;
    const u = (px * placed.right.x + pz * placed.right.z) / width + 0.5;
    const v = 0.5 - py / height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    hit.t = t;
    hit.u = u;
    hit.v = v;
    return true;
};
