import type { Point } from "../canopy/boids/types";
import { CELL } from "../canopy/dither/surface";
import { clamp, lerp, smoothstep } from "../canopy/random";
import { TILE_PX, type Tile } from "./headline-tiles";
import { easeOutCubic, span } from "./timeline";

/** A petal as drawn: where it is on screen, its spin in the screen plane and its end-over-end flip. */
export type PetalPose = { x: number; y: number; spin: number; flip: number; radius: number };

/** A petal shaken out of a blossom that tumbles down onto one tile of the next headline. */
export type Arrival = {
    tile: Tile;
    headline: number;
    release: number;
    land: number;
    /** The strand blossom it falls from, and where that blossom was when it let go (filled in by the simulation). */
    source: number;
    origin: Point;
    depth: number;
    rock: number;
    rockRate: number;
    spinTurns: number;
    sway: number;
    swayRate: number;
    phase: number;
    radius: number;
};

/** A tile of the outgoing headline that the gust peels off and carries away. */
export type Departure = {
    tile: Tile;
    headline: number;
    liftoff: number;
    push: number;
    lift: number;
    depth: number;
    rock: number;
    rockRate: number;
    spinRate: number;
    phase: number;
    radius: number;
};

/** A petal that falls from the tree while a headline holds, the way they always do on the page. */
export type Drift = { release: number; source: number; origin: Point; terminal: number; swing: number; swayRate: number; phase: number; flipRate: number; radius: number };

/** Petals that come toward the lens grow by FOCAL / (FOCAL - z), about the centre of the frame. */
const FOCAL = 600;
const LANDED_RADIUS = TILE_PX * 0.58;
export const DEPART_SECONDS = 1.8;
/** How a falling petal leaves its blossom and how it comes in to land, in px per second of flight. */
const LEAVING = { x: 150, y: 40 };
const ARRIVING = { x: 45, y: 70 };
const DRIFT_PX_PER_SECOND = 10;

function project(x: number, y: number, z: number, centre: Point, out: PetalPose) {
    const scale = FOCAL / (FOCAL - z);
    out.x = centre.x + (x - centre.x) * scale;
    out.y = centre.y + (y - centre.y) * scale;
    return scale;
}

/** A cubic Hermite curve, which leaves the blossom moving with the wind and arrives gently. */
function hermite(from: number, leaving: number, to: number, arriving: number, s: number) {
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * from + (s3 - 2 * s2 + s) * leaving + (-2 * s3 + 3 * s2) * to + (s3 - s2) * arriving;
}

/** A petal in the air rocks about its long axis, showing its blossom face, so its outline thins and swells as it turns. */
const rocking = (amount: number, rate: number, age: number, phase: number) => amount * Math.sin(rate * age + phase);

/**
 * A petal falls blossom side up and turns over onto its ink side as it lands, so the letters
 * darken petal by petal. The full stop lands blossom side up and stays red.
 */
export function arrivalPose(arrival: Arrival, age: number, centre: Point, out: PetalPose) {
    const seconds = arrival.land - arrival.release;
    const s = clamp(age / seconds, 0, 1);
    const { origin, tile } = arrival;
    const lift = Math.sin(Math.PI * s);
    const x = hermite(origin.x, LEAVING.x * seconds, tile.x, ARRIVING.x * seconds, s) + arrival.sway * Math.sin(arrival.swayRate * age + arrival.phase) * lift;
    const y = hermite(origin.y, LEAVING.y * seconds, tile.y, ARRIVING.y * seconds, s);
    const scale = project(x, y, arrival.depth * lift, centre, out);
    const unwound = 1 - easeOutCubic(s);
    const settled = smoothstep(0.7, 1, s);
    out.flip = rocking(arrival.rock, arrival.rockRate, age, arrival.phase) * (1 - settled) + (tile.isPeriod ? 0 : Math.PI * settled);
    out.spin = arrival.spinTurns * Math.PI * 2 * unwound;
    out.radius = lerp(arrival.radius, LANDED_RADIUS, span(s, 0.8, 1)) * scale;
    return out;
}

/** The gust turns each tile over onto its blossom side as it lifts it, then pushes harder the longer it is airborne. */
export function departurePose(departure: Departure, age: number, centre: Point, out: PetalPose) {
    const { tile } = departure;
    const x = tile.x + 20 * age + 0.5 * departure.push * age * age + 22 * Math.sin(3.1 * age + departure.phase) * age;
    const y = tile.y - departure.lift * age - 40 * age * age + 18 * Math.sin(4.3 * age + departure.phase * 1.7) * age;
    const scale = project(x, y, departure.depth * span(age, 0, DEPART_SECONDS) ** 2, centre, out);
    out.flip = Math.PI * (1 - smoothstep(0, 0.22, age)) + rocking(departure.rock, departure.rockRate, age, departure.phase) * smoothstep(0.1, 0.4, age);
    out.spin = departure.spinRate * age;
    out.radius = lerp(LANDED_RADIUS, departure.radius, span(age, 0, 0.2)) * scale;
    return out;
}

export function driftPose(drift: Drift, age: number, out: PetalPose) {
    out.x = drift.origin.x + DRIFT_PX_PER_SECOND * age + drift.swing * (Math.sin(drift.phase + drift.swayRate * age) - Math.sin(drift.phase));
    out.y = drift.origin.y + drift.terminal * age;
    out.flip = drift.flipRate * age;
    out.spin = drift.phase + age * 0.8;
    out.radius = drift.radius;
    return out;
}

/** Draws a petal into the density buffer: its blossom face in the blossom channel, its back in the ink one. */
export function paintPetal(density: CanvasRenderingContext2D, pose: PetalPose, alpha = 0.95) {
    const squash = Math.max(0.15, Math.abs(Math.cos(pose.flip)));
    const cos = Math.cos(pose.spin) / CELL;
    const sin = Math.sin(pose.spin) / CELL;
    density.globalAlpha = alpha;
    density.fillStyle = Math.cos(pose.flip) >= 0 ? "#00ff00" : "#ff0000";
    density.setTransform(cos, sin, -sin * squash, cos * squash, pose.x / CELL, pose.y / CELL);
    density.beginPath();
    density.ellipse(0, 0, pose.radius, pose.radius * 0.62, 0, 0, Math.PI * 2);
    density.fill();
}
