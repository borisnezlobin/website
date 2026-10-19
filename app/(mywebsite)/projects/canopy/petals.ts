import type { Point } from "./boids/types";
import { CELL } from "./dither/surface";
import { between, type Random } from "./random";
import type { Wind } from "./wind";

type Petal = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** Phase of the end-over-end flip; the petal looks thin when it is edge on. */
    flip: number;
    flipRate: number;
    spin: number;
    spinRate: number;
    swayPhase: number;
    swayRate: number;
    swing: number;
    terminal: number;
    size: number;
};

export type PetalOptions = { maxPetals: number; perSecond: number; fallSpeed: [number, number]; swing: [number, number]; size: [number, number] };

export const DEFAULT_PETALS: PetalOptions = { maxPetals: 40, perSecond: 1.3, fallSpeed: [24, 42], swing: [16, 40], size: [3.2, 4.6] };

/** Petals dissolve between these two heights, in CSS px, so the lower screen stays calm. */
export type PetalFade = { from: number; to: number };

/** Sideways drift in px/s for each radian of wind lean. */
const DRIFT_PER_LEAN = 300;

/**
 * Falling petals. A petal falls slowest when it lies flat, slips sideways as it rocks, and
 * tumbles, which is what reads as a real petal rather than a sliding dot.
 */
export function createPetals(random: Random, fade: PetalFade, options: PetalOptions = DEFAULT_PETALS) {
    const petals: Petal[] = [];
    let owed = 0;

    const release = (x: number, y: number) => {
        if (petals.length >= options.maxPetals) return;
        petals.push({
            x,
            y,
            vx: 0,
            vy: 2,
            flip: random() * Math.PI * 2,
            flipRate: between(random, 1.4, 3.8) * (random() < 0.5 ? -1 : 1),
            spin: random() * Math.PI * 2,
            spinRate: between(random, -1.6, 1.6),
            swayPhase: random() * Math.PI * 2,
            swayRate: between(random, 1.1, 2.3),
            swing: between(random, ...options.swing),
            terminal: between(random, ...options.fallSpeed),
            size: between(random, ...options.size),
        });
    };

    const movePetal = (petal: Petal, wind: Wind, dt: number) => {
        petal.flip += petal.flipRate * dt;
        petal.spin += petal.spinRate * dt;
        petal.swayPhase += petal.swayRate * dt;
        const flatness = Math.abs(Math.cos(petal.flip));
        const targetFall = petal.terminal * (1.15 - 0.55 * flatness);
        const targetSide = wind.lean(petal.x) * DRIFT_PER_LEAN + Math.sin(petal.swayPhase) * petal.swing;
        petal.vy += (targetFall - petal.vy) * Math.min(1, dt * 2.2);
        petal.vx += (targetSide - petal.vx) * Math.min(1, dt * 2.6);
        petal.x += petal.vx * dt;
        petal.y += petal.vy * dt;
    };

    const update = (dt: number, wind: Wind, spawn: (out: Point) => boolean) => {
        owed += options.perSecond * dt;
        const origin = { x: 0, y: 0 };
        while (owed >= 1) {
            owed -= 1;
            if (spawn(origin)) release(origin.x, origin.y);
        }
        for (const petal of petals) movePetal(petal, wind, dt);
        for (let i = petals.length - 1; i >= 0; i--) if (petals[i].y > fade.to) petals.splice(i, 1);
    };

    /** Petals go into the blossom channel of the density buffer, already scaled to cells. */
    const paint = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = "#00ff00";
        for (const petal of petals) {
            ctx.globalAlpha = 0.95 * Math.min(1, Math.max(0, (fade.to - petal.y) / (fade.to - fade.from)));
            const tilt = Math.sin(petal.swayPhase) * 0.5;
            const cos = Math.cos(petal.spin + tilt) / CELL;
            const sin = Math.sin(petal.spin + tilt) / CELL;
            const squash = Math.max(0.15, Math.abs(Math.cos(petal.flip)));
            ctx.setTransform(cos, sin, -sin * squash, cos * squash, petal.x / CELL, petal.y / CELL);
            ctx.beginPath();
            ctx.ellipse(0, 0, petal.size, petal.size * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
    };

    /** Pre-fills the air so the first frame isn't empty. */
    const scatter = (count: number, width: number, top: number, bottom: number) => {
        for (let i = 0; i < count; i++) {
            release(random() * width, between(random, top, bottom));
            petals[petals.length - 1].vy = petals[petals.length - 1].terminal;
        }
    };

    return { update, paint, scatter };
}
