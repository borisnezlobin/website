import type { Contact } from "../clearance";
import type { FlowProbe } from "../flow-probe";

/**
 * One paper print floating on the creek, as a rigid rectangle in CSS pixels. Its velocity and
 * spin relax towards the water's (fitted over its corners, so shear turns it as well as vorticity),
 * it bumps off stone and is carried round it, and a held print (hovered or focused) slows to almost
 * nothing while the water keeps running past it. A print that stays blocked (wedged against a rock
 * or behind other prints) rides up over the obstacle for a moment, so the stream never jams.
 */
export type PrintBody = {
    x: number;
    y: number;
    angle: number;
    vx: number;
    vy: number;
    spin: number;
    width: number;
    height: number;
    /** How strongly the print is held, eased towards 1 while hovered or focused. */
    hold: number;
    held: boolean;
    /** Fraction of the surface speed the print travels at; paper rides slightly behind the water. */
    lag: number;
    seed: number;
    /** Seconds spent blocked while the water runs past. */
    blocked: number;
    /** Seconds left riding over obstacles; while positive, stone and other prints are ignored. */
    riding: number;
    /** 0..1 eased version of `riding`, for the lift it shows. */
    rise: number;
    /** Outward normal of the stone the print touched last frame, zero when it touched nothing. */
    touchNx: number;
    touchNy: number;
    active: boolean;
};

const VELOCITY_RESPONSE = 0.35;
const SPIN_RESPONSE = 0.55;
const HOLD_RESPONSE = 0.12;
const HELD_DRIFT = 0.06;
const CONTACT_MARGIN = 5;
const RESTITUTION = 0.15;
const BOUNCE_SPEED = 30;
const CORRECTION = 0.5;
const BLOCKED_SHARE = 0.3;
const BLOCKED_SECONDS = 2.2;
const RIDE_SECONDS = 2.4;
const MAX_SPIN = 2.2;
const MIN_TOP_SPEED = 240;

const ease = (dt: number, seconds: number) => 1 - Math.exp(-dt / seconds);

export function createPrintBody(width: number, height: number, seed: number): PrintBody {
    return {
        x: 0, y: 0, angle: (seed - 0.5) * 0.6, vx: 0, vy: 0, spin: 0, width, height,
        hold: 0, held: false, lag: 0.82 + seed * 0.12, seed, blocked: 0, riding: 0, rise: 0, touchNx: 0, touchNy: 0, active: false,
    };
}

export const printRadius = (body: PrintBody) => 0.5 * Math.hypot(body.width, body.height);

const OUTLINE_SPACING_PX = 14;

function interiorPoints(hw: number, hh: number, local: number[][]) {
    const across = Math.max(1, Math.round((hw * 2) / OUTLINE_SPACING_PX)), down = Math.max(1, Math.round((hh * 2) / OUTLINE_SPACING_PX));
    for (let i = 1; i < across; i++) {
        for (let j = 1; j < down; j++) local.push([-hw + (2 * hw * i) / across, -hh + (2 * hh * j) / down]);
    }
}

/**
 * Offsets of the four corners, then points every few pixels along each edge and across the
 * inside (so a pebble smaller than the print is still felt), rotated with the print.
 */
function footprintPoints(body: PrintBody) {
    const cos = Math.cos(body.angle), sin = Math.sin(body.angle);
    const hw = body.width / 2, hh = body.height / 2;
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const local = [...corners];
    corners.forEach(([ax, ay], c) => {
        const [bx, by] = corners[(c + 1) % 4];
        const count = Math.ceil(Math.hypot(bx - ax, by - ay) / OUTLINE_SPACING_PX);
        for (let n = 1; n < count; n++) local.push([ax + ((bx - ax) * n) / count, ay + ((by - ay) * n) / count]);
    });
    interiorPoints(hw, hh, local);
    return local.map(([lx, ly]) => [lx * cos - ly * sin, lx * sin + ly * cos]);
}

const scratch = { x: 0, y: 0 };

/** The water's motion over the print: mean velocity plus the least-squares rotation of its corners. */
function fitWater(body: PrintBody, probe: FlowProbe, points: number[][]) {
    probe.velocity(body.x, body.y, scratch);
    const cx = scratch.x, cy = scratch.y;
    let sumX = cx, sumY = cy, turn = 0, reach = 0;
    for (let p = 0; p < 4; p++) {
        const [rx, ry] = points[p];
        probe.velocity(body.x + rx, body.y + ry, scratch);
        sumX += scratch.x; sumY += scratch.y;
        turn += rx * (scratch.y - cy) - ry * (scratch.x - cx);
        reach += rx * rx + ry * ry;
    }
    return { vx: sumX / 5, vy: sumY / 5, spin: turn / Math.max(1, reach) };
}

const contact: Contact = { distance: 0, nx: 0, ny: 0 };

type Touch = { rx: number; ry: number; nx: number; ny: number; depth: number };

function findTouches(body: PrintBody, probe: FlowProbe, points: number[][]) {
    const touches: Touch[] = [];
    for (const [rx, ry] of points) {
        probe.contact(body.x + rx, body.y + ry, contact);
        const depth = CONTACT_MARGIN - contact.distance;
        if (depth > 0) touches.push({ rx, ry, nx: contact.nx, ny: contact.ny, depth });
    }
    return touches;
}

/** Stops the print moving into stone at one contact point (a slight bounce if it hit hard), with spin from how far off-centre it hit. */
function bounce(body: PrintBody, touch: Touch, share: number) {
    const inertia = (body.width ** 2 + body.height ** 2) / 12;
    const { rx, ry, nx, ny } = touch;
    const approach = (body.vx - body.spin * ry) * nx + (body.vy + body.spin * rx) * ny;
    if (approach >= 0) return;
    const lever = rx * ny - ry * nx;
    const restitution = approach < -BOUNCE_SPEED ? RESTITUTION : 0;
    const impulse = (-(1 + restitution) * approach) / (1 + (lever * lever) / inertia);
    body.vx += impulse * nx * share;
    body.vy += impulse * ny * share;
    body.spin += (impulse * lever * share) / inertia;
}

/**
 * Eases the print out of the stone it overlaps along the depth-weighted mean of the contact
 * normals (so a rock under the middle of the print can't flip the push from side to side each
 * frame) and stops it moving inwards. Returns that mean contact.
 */
function bumpStone(body: PrintBody, touches: Touch[]): Touch | null {
    if (touches.length === 0) return null;
    let sx = 0, sy = 0, depth = 0;
    for (const touch of touches) { sx += touch.nx * touch.depth; sy += touch.ny * touch.depth; depth = Math.max(depth, touch.depth); }
    const length = Math.hypot(sx, sy);
    if (length < 1e-3) return null;
    const mean: Touch = { rx: 0, ry: 0, nx: sx / length, ny: sy / length, depth };
    body.x += mean.nx * depth * CORRECTION;
    body.y += mean.ny * depth * CORRECTION;
    for (const touch of touches) bounce(body, touch, 1 / touches.length);
    return mean;
}

/** Riding over an obstacle only ends once the print is clear of it, so it never lands on a rock. */
function landRide(body: PrintBody, touches: Touch[]) {
    if (body.riding > 0 && body.riding < 0.2 && touches.length > 0) body.riding = 0.2;
}

/**
 * Water parts round a rock, so a print pressed against one follows the water's run along the rock
 * face: its target velocity loses the part heading into the stone. Relaxing towards a target
 * (instead of adding a push) can't overshoot, which keeps pinned prints from shuddering.
 */
function alongFace(water: WaterFit, body: PrintBody): WaterFit {
    const into = water.vx * body.touchNx + water.vy * body.touchNy;
    if (into >= 0) return water;
    return { vx: water.vx - into * body.touchNx, vy: water.vy - into * body.touchNy };
}

function rememberTouch(body: PrintBody, touch: Touch | null) {
    body.touchNx = touch ? touch.nx : 0;
    body.touchNy = touch ? touch.ny : 0;
}

const SHORE_REACH = 1.15;
const SHORE_PUSH = 70;

/**
 * The current runs along a bank rather than into it, so a print drifting close to stone is eased
 * back out towards open water before it pins itself in a corner of the narrows.
 */
function easeOffShore(body: PrintBody, probe: FlowProbe, dt: number) {
    const reach = printRadius(body) * SHORE_REACH;
    probe.contact(body.x, body.y, contact);
    if (contact.distance >= reach) return;
    const closeness = 1 - Math.max(0, contact.distance) / reach;
    body.vx += contact.nx * SHORE_PUSH * closeness * dt;
    body.vy += contact.ny * SHORE_PUSH * closeness * dt;
}

/** Counts how long the print has been held back while the water runs; past a moment it rides over. */
function watchForJam(body: PrintBody, water: WaterFit, dt: number) {
    body.riding = Math.max(0, body.riding - dt);
    body.rise += ((body.riding > 0 ? 1 : 0) - body.rise) * ease(dt, 0.3);
    const flowing = Math.hypot(water.vx, water.vy) * body.lag;
    const crawling = Math.hypot(body.vx, body.vy) < flowing * BLOCKED_SHARE;
    body.blocked = crawling && !body.held && flowing > 20 ? body.blocked + dt : 0;
    if (body.blocked < BLOCKED_SECONDS) return;
    body.blocked = 0;
    body.riding = RIDE_SECONDS;
}

function clampMotion(body: PrintBody, water: WaterFit) {
    const top = Math.max(MIN_TOP_SPEED, 1.6 * Math.hypot(water.vx, water.vy));
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > top) { body.vx *= top / speed; body.vy *= top / speed; }
    body.spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, body.spin));
}

export type WaterFit = { vx: number; vy: number };

export const isRiding = (body: PrintBody) => body.riding > 0;

export function stepPrintBody(body: PrintBody, probe: FlowProbe, dt: number): WaterFit {
    body.hold += ((body.held ? 1 : 0) - body.hold) * ease(dt, HOLD_RESPONSE);
    const points = footprintPoints(body);
    const water = fitWater(body, probe, points);
    const target = alongFace(water, body);
    const drift = body.lag * (1 - (1 - HELD_DRIFT) * body.hold);
    body.vx += (target.vx * drift - body.vx) * ease(dt, VELOCITY_RESPONSE);
    body.vy += (target.vy * drift - body.vy) * ease(dt, VELOCITY_RESPONSE);
    body.spin += (water.spin * (1 - body.hold) - body.spin) * ease(dt, SPIN_RESPONSE);
    if (!isRiding(body)) easeOffShore(body, probe, dt);
    clampMotion(body, water);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.angle += body.spin * dt;
    const touches = findTouches(body, probe, points);
    landRide(body, touches);
    rememberTouch(body, isRiding(body) ? null : bumpStone(body, touches));
    watchForJam(body, water, dt);
    return water;
}

const PRINT_GAP = 4;
/** Overlaps are worked out over a few frames, never in one visible jump. */
const MAX_SEPARATION_STEP = 2.5;

type Axis = { x: number; y: number };

const axesOf = (body: PrintBody): Axis[] => {
    const cos = Math.cos(body.angle), sin = Math.sin(body.angle);
    return [{ x: cos, y: sin }, { x: -sin, y: cos }];
};

/** Half the print's extent when projected onto `axis`. */
function halfExtent(body: PrintBody, axes: Axis[], axis: Axis) {
    const along = Math.abs(axes[0].x * axis.x + axes[0].y * axis.y), across = Math.abs(axes[1].x * axis.x + axes[1].y * axis.y);
    return (body.width / 2) * along + (body.height / 2) * across + PRINT_GAP / 2;
}

/** Separating-axis test for two rotated rectangles: the shallowest overlap and its direction from a to b. */
function overlapOf(a: PrintBody, b: PrintBody) {
    const axesA = axesOf(a), axesB = axesOf(b);
    const dx = b.x - a.x, dy = b.y - a.y;
    let depth = Infinity, nx = 0, ny = 0;
    for (const axis of [...axesA, ...axesB]) {
        const distance = dx * axis.x + dy * axis.y;
        const overlap = halfExtent(a, axesA, axis) + halfExtent(b, axesB, axis) - Math.abs(distance);
        if (overlap <= 0) return null;
        if (overlap < depth) { depth = overlap; nx = axis.x * Math.sign(distance || 1); ny = axis.y * Math.sign(distance || 1); }
    }
    return { depth, nx, ny };
}

/** Keeps two prints from overlapping: pushes them apart along the shallowest axis and trades momentum. */
export function separatePrints(a: PrintBody, b: PrintBody) {
    if (isRiding(a) || isRiding(b)) return;
    if (Math.hypot(b.x - a.x, b.y - a.y) > printRadius(a) + printRadius(b)) return;
    const hit = overlapOf(a, b);
    if (!hit) return;
    const { depth, nx, ny } = hit;
    const shareA = b.held ? 1 : a.held ? 0 : 0.5;
    const push = Math.min(MAX_SEPARATION_STEP, depth * CORRECTION * 2);
    a.x -= nx * push * shareA; a.y -= ny * push * shareA;
    b.x += nx * push * (1 - shareA); b.y += ny * push * (1 - shareA);
    const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (closing >= 0) return;
    a.vx += nx * closing * 0.5; a.vy += ny * closing * 0.5;
    b.vx -= nx * closing * 0.5; b.vy -= ny * closing * 0.5;
}
