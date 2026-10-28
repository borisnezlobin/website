import { seededRandom } from "@/app/(mywebsite)/projects/canopy/random";
import type { Point } from "./flight-path";
import type { BodyCapsule } from "./whale-rise";
import { BEATS, LOOP_SECONDS, smoothstep, span } from "./timeline";

const STEPS_PER_SECOND = 60;
const LOOP_STEPS = LOOP_SECONDS * STEPS_PER_SECOND;
/** The second loop is kept; its last stretch blends into the first loop's, which runs on into second 0. */
const SEAM_SECONDS = 0.5;
export const BIRDS = 210;
/** How far the tail of a ribbon flies behind its head along the same path. */
const TRAIL_SECONDS = 0.5;
/** Behind the pen the flock is a comet: a dense tip on the ink, and a tail that thins and widens to about this much either side. */
const TAIL_SPREAD = 46;
/** Above 1 crowds the birds toward the tip. */
const TIP_CROWDING = 1.6;

/** The home page's boid rules, from app/components/landing/boid-canvas.tsx. */
const PERCEPTION = 120;
const AVOIDANCE = 16;
const AVOIDANCE_WEIGHT = 15;
const ALIGNMENT_WEIGHT = 1;
const COHESION_WEIGHT = 0.1;
/** The home page's whale avoidance: a margin round the body and a hard push out of it. */
const WHALE_MARGIN = 55;
const WHALE_FORCE = 2200;
/** The home page's top speed, for the murmuration; on the ribbon the birds have to keep up with the pen. */
const MAX_SPEED = { murmur: 560, ribbon: 1600 };

/** How tightly a bird holds its place: hard on the ribbon (so the pen writes cleanly), loose in the murmuration. */
const HOLD = { ribbon: { pull: 70, match: 12 }, murmur: { pull: 3.2, match: 1.2 } };

/**
 * `lag` is how far behind the head the bird flies on the ribbon, and `spread` how far to one side
 * of the path it drifts as it falls back; `restX`/`restY` is its place in the murmuration's
 * resting shape, before the shape stretches, turns and folds.
 */
type Bird = { lag: number; spread: number; restX: number; restY: number };

export type Flock = {
    /** Where bird `index` is and which way it heads at time t. */
    birdAt(index: number, t: number, out: { x: number; y: number; heading: number }): void;
};

function castBirds(): Bird[] {
    const random = seededRandom(2718);
    const gaussian = () => (random() + random() + random() + random() - 2) * 0.87;
    return Array.from({ length: BIRDS }, () => ({
        lag: random() ** TIP_CROWDING * TRAIL_SECONDS,
        spread: gaussian(),
        restX: gaussian(),
        restY: gaussian(),
    }));
}

/**
 * How far into the murmuration a bird is. The head peels off first, and a bird only leaves the
 * murmuration once its own place on the ribbon has moved off onto the dive, so the flock pours
 * out after the head in order instead of balling up where the head left.
 */
function murmurShare(bird: Bird, t: number) {
    const join = smoothstep(span(t, BEATS.liftOff[0] + 0.4 + bird.lag * 1.6, BEATS.liftOff[1] + 0.3 + bird.lag * 1.6));
    const leave = smoothstep(span(t, BEATS.murmurEnds + bird.lag - 0.1, BEATS.murmurEnds + bird.lag + 0.4));
    return join * (1 - leave);
}

/**
 * Where a bird sits in the murmuration: the whole flock is one shape that stretches into a band,
 * turns, and has a wave running down its length, so it folds over itself the way starlings do and
 * neighbouring birds always fly the same way.
 */
function inMurmuration(bird: Bird, t: number, centre: Point) {
    const stretch = 1.9 + 0.9 * Math.sin(t * 0.9);
    const length = 120 * stretch, depth = 70 / Math.sqrt(stretch);
    const along = bird.restX * length, across = bird.restY * depth + 46 * Math.sin(bird.restX * 2.2 - t * 2.4);
    const turn = 0.5 * Math.sin(t * 0.55) + 0.25 * Math.sin(t * 1.3 + 1);
    return {
        x: centre.x + along * Math.cos(turn) - across * Math.sin(turn),
        y: centre.y + along * Math.sin(turn) + across * Math.cos(turn),
    };
}

/** A bird's place in the comet behind the head: on the head's path, drifting off to its side of the path as it falls back. */
function inRibbon(bird: Bird, t: number, head: (t: number) => Point) {
    const here = head(t - bird.lag), ahead = head(t - bird.lag + 0.03);
    const dx = ahead.x - here.x, dy = ahead.y - here.y;
    const length = Math.hypot(dx, dy) || 1;
    const out = bird.spread * TAIL_SPREAD * Math.sqrt(bird.lag / TRAIL_SECONDS);
    return { x: here.x - (dy / length) * out, y: here.y + (dx / length) * out };
}

function placeOf(bird: Bird, t: number, head: (t: number) => Point, murmur: (t: number) => Point) {
    const share = murmurShare(bird, t);
    const ribbon = inRibbon(bird, t, head);
    if (share <= 0) return { ...ribbon, share };
    const orbit = inMurmuration(bird, t, murmur(t));
    return { x: ribbon.x + (orbit.x - ribbon.x) * share, y: ribbon.y + (orbit.y - ribbon.y) * share, share };
}

/** The push away from the whale's body, if a bird is inside its margin. */
function whalePush(x: number, y: number, body: BodyCapsule | null) {
    if (!body) return { x: 0, y: 0 };
    const sx = body.toX - body.fromX, sy = body.toY - body.fromY;
    const u = Math.min(1, Math.max(0, ((x - body.fromX) * sx + (y - body.fromY) * sy) / (sx * sx + sy * sy || 1)));
    const dx = x - (body.fromX + sx * u), dy = y - (body.fromY + sy * u);
    const distance = Math.hypot(dx, dy) || 1;
    const depth = 1 - (distance - body.radius) / WHALE_MARGIN;
    if (depth <= 0) return { x: 0, y: 0 };
    const strength = WHALE_FORCE * Math.min(2, depth);
    return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}

type State = { x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array };

/** Separation keeps birds apart in every phase; alignment and cohesion only matter while they flock freely. */
function flocking(state: State, i: number, freedom: number) {
    let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, seen = 0;
    for (let j = 0; j < BIRDS; j++) {
        if (j === i) continue;
        const dx = state.x[j] - state.x[i], dy = state.y[j] - state.y[i];
        const d2 = dx * dx + dy * dy;
        if (d2 >= PERCEPTION * PERCEPTION) continue;
        ax += state.vx[j]; ay += state.vy[j]; cx += dx; cy += dy; seen++;
        if (d2 > 0 && d2 < AVOIDANCE * AVOIDANCE) {
            const strength = (AVOIDANCE - Math.sqrt(d2)) / AVOIDANCE;
            sx -= dx * strength; sy -= dy * strength;
        }
    }
    if (!seen) return { x: 0, y: 0 };
    return {
        x: sx * AVOIDANCE_WEIGHT + ((ax / seen - state.vx[i]) * ALIGNMENT_WEIGHT + (cx / seen) * COHESION_WEIGHT) * freedom,
        y: sy * AVOIDANCE_WEIGHT + ((ay / seen - state.vy[i]) * ALIGNMENT_WEIGHT + (cy / seen) * COHESION_WEIGHT) * freedom,
    };
}

function capSpeed(state: State, i: number, share: number) {
    const limit = MAX_SPEED.ribbon + (MAX_SPEED.murmur - MAX_SPEED.ribbon) * share;
    const speed = Math.hypot(state.vx[i], state.vy[i]);
    if (speed <= limit) return;
    state.vx[i] *= limit / speed;
    state.vy[i] *= limit / speed;
}

/**
 * The flock, flown at a fixed step for two loops so the second starts from a settled first one.
 * Each bird chases its place (on the ribbon, or on its orbit in the murmuration) with the home
 * page's boid rules on top, and swerves round the whale.
 */
export function flyFlock(head: (t: number) => Point, murmur: (t: number) => Point, whale: (t: number) => BodyCapsule | null): Flock {
    const birds = castBirds();
    const dt = 1 / STEPS_PER_SECOND;
    const state: State = { x: new Float32Array(BIRDS), y: new Float32Array(BIRDS), vx: new Float32Array(BIRDS), vy: new Float32Array(BIRDS) };
    birds.forEach((bird, i) => {
        const here = placeOf(bird, 0, head, murmur), ahead = placeOf(bird, dt, head, murmur);
        state.x[i] = here.x; state.y[i] = here.y; state.vx[i] = (ahead.x - here.x) / dt; state.vy[i] = (ahead.y - here.y) / dt;
    });
    const track = new Float32Array(2 * LOOP_STEPS * BIRDS * 3);
    for (let step = 0; step < 2 * LOOP_STEPS; step++) {
        const t = (step * dt) % LOOP_SECONDS;
        const body = whale(t);
        birds.forEach((bird, i) => {
            const place = placeOf(bird, t, head, murmur), next = placeOf(bird, t + dt, head, murmur);
            const pull = HOLD.ribbon.pull + (HOLD.murmur.pull - HOLD.ribbon.pull) * place.share;
            const match = HOLD.ribbon.match + (HOLD.murmur.match - HOLD.ribbon.match) * place.share;
            const flock = flocking(state, i, place.share);
            const push = whalePush(state.x[i], state.y[i], body);
            state.vx[i] += (flock.x + (place.x - state.x[i]) * pull + ((next.x - place.x) / dt - state.vx[i]) * match + push.x) * dt;
            state.vy[i] += (flock.y + (place.y - state.y[i]) * pull + ((next.y - place.y) / dt - state.vy[i]) * match + push.y) * dt;
            capSpeed(state, i, place.share);
        });
        for (let i = 0; i < BIRDS; i++) {
            state.x[i] += state.vx[i] * dt;
            state.y[i] += state.vy[i] * dt;
            const at = (step * BIRDS + i) * 3;
            track[at] = state.x[i]; track[at + 1] = state.y[i]; track[at + 2] = Math.atan2(state.vy[i], state.vx[i]);
        }
    }

    const read = (step: number, i: number, k: number) => track[(step * BIRDS + i) * 3 + k];
    const birdAt = (index: number, t: number, out: { x: number; y: number; heading: number }) => {
        const step = Math.round((((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) * STEPS_PER_SECOND) % LOOP_STEPS;
        const kept = LOOP_STEPS + step;
        const blend = smoothstep(span(step * dt, LOOP_SECONDS - SEAM_SECONDS, LOOP_SECONDS));
        out.x = read(kept, index, 0) + (read(step, index, 0) - read(kept, index, 0)) * blend;
        out.y = read(kept, index, 1) + (read(step, index, 1) - read(kept, index, 1)) * blend;
        const turn = Math.atan2(Math.sin(read(step, index, 2) - read(kept, index, 2)), Math.cos(read(step, index, 2) - read(kept, index, 2)));
        out.heading = read(kept, index, 2) + turn * blend;
    };
    return { birdAt };
}
