import { isWideFigure } from "../lib/frame-layout";
import { screenToSurface } from "./projection";
import { driftRate } from "./rotation-model";

export type SunDisk = {
    w: number;
    h: number;
    wide: boolean;
    cx: number;
    cy: number;
    radius: number;
    cell: number;
    columns: number;
    rimRatio: Float32Array;
    latitude: Float32Array;
    longitude: Float32Array;
    drift: Float32Array;
    limb: Float32Array;
};

const sampleCell = (disk: SunDisk, index: number, x: number, y: number) => {
    const u = (x - disk.cx) / disk.radius, v = (disk.cy - y) / disk.radius;
    const r2 = u * u + v * v;
    disk.rimRatio[index] = Math.sqrt(r2);
    if (r2 >= 1) return;
    const z = Math.sqrt(1 - r2);
    const { latitude, longitude } = screenToSurface(u, v, z);
    disk.latitude[index] = latitude;
    disk.longitude[index] = longitude;
    disk.drift[index] = driftRate(latitude);
    disk.limb[index] = z;
};

export const createSunDisk = (w: number, h: number, cell: number): SunDisk => {
    const wide = isWideFigure(w);
    const columns = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const size = columns * rows;
    const disk: SunDisk = {
        w, h, wide, cell, columns,
        cx: w / 2,
        cy: h / 2,
        radius: h * 0.42,
        rimRatio: new Float32Array(size),
        latitude: new Float32Array(size),
        longitude: new Float32Array(size),
        drift: new Float32Array(size),
        limb: new Float32Array(size),
    };
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) sampleCell(disk, j * columns + i, (i + 0.5) * cell, (j + 0.5) * cell);
    }
    return disk;
};

export const cellIndex = (disk: SunDisk, x: number, y: number) =>
    Math.floor(y / disk.cell) * disk.columns + Math.floor(x / disk.cell);
