import type { Point } from "./boids/types";
import type { Pointer } from "./scene-loop";

export type StrandSpec = {
    /** Wood node the strand hangs from. */
    node: number;
    length: number;
    /** Initial angle of the stalk where it leaves the twig, which straightens out within HOOK_SHARE. */
    hook: number;
    /** How strongly this strand answers the wind, around 1. */
    response: number;
};

const SEGMENT = 11;
const HOOK_SHARE = 0.16;
/** Sets the swing period: a strand of length L swings at roughly sqrt(SWING / L) rad/s. */
const SWING = 2100;
const SWING_DAMPING = 0.9;
const CURL_STIFFNESS = 3.2;
const CURL_DAMPING = 3.4;
/** How far the tip trails the root while a gust is still building. */
const CURL_LAG = 0.85;
const POINTER_RADIUS = 46;
const POINTER_SHOVE = 3.2;
const POINTER_DRAG = 0.004;

/**
 * Hanging strands as two damped modes each: a pendulum swing of the whole strand and a curl that
 * lets the tip trail behind. Every point is placed by walking fixed-length segments, so a strand
 * can never stretch, sag or be yanked, whatever the frame rate does.
 */
export function createCurtain(specs: StrandSpec[]) {
    const count = specs.length;
    const starts = new Int32Array(count + 1);
    specs.forEach((spec, index) => {
        starts[index + 1] = starts[index] + Math.max(3, Math.round(spec.length / SEGMENT)) + 1;
    });
    const x = new Float32Array(starts[count]);
    const y = new Float32Array(starts[count]);
    const swing = new Float32Array(count);
    const swingSpeed = new Float32Array(count);
    const curl = new Float32Array(count);
    const curlSpeed = new Float32Array(count);
    const stiffness = Float32Array.from(specs, (spec) => SWING / Math.max(40, spec.length));
    const segmentLength = Float32Array.from(specs, (spec, index) => spec.length / (starts[index + 1] - starts[index] - 1));

    const prime = (leanAt: (x: number) => number, anchorX: (strand: number) => number) => {
        for (let strand = 0; strand < count; strand++) swing[strand] = leanAt(anchorX(strand)) * specs[strand].response;
    };

    const step = (dt: number, leanAt: (x: number) => number) => {
        for (let strand = 0; strand < count; strand++) {
            const root = starts[strand];
            const target = leanAt(x[root]) * specs[strand].response;
            const k = stiffness[strand];
            swingSpeed[strand] += (k * (target - swing[strand]) - SWING_DAMPING * swingSpeed[strand]) * dt;
            swing[strand] += swingSpeed[strand] * dt;
            const trail = (swing[strand] - target) * CURL_LAG - swingSpeed[strand] * 0.08;
            curlSpeed[strand] += (k * CURL_STIFFNESS * (trail - curl[strand]) - CURL_DAMPING * curlSpeed[strand]) * dt;
            curl[strand] += curlSpeed[strand] * dt;
        }
    };

    const shoveStrand = (strand: number, pointer: Pointer, dt: number) => {
        const root = starts[strand];
        const last = starts[strand + 1] - 1;
        if (pointer.y < y[root] || pointer.y > y[last] + 8) return;
        const along = Math.min(last, root + Math.round((pointer.y - y[root]) / segmentLength[strand]));
        const offset = x[along] - pointer.x;
        if (Math.abs(offset) > POINTER_RADIUS) return;
        const reach = (along - root + 1) / (last - root + 1);
        const closeness = 1 - Math.abs(offset) / POINTER_RADIUS;
        const away = Math.sign(offset) || 1;
        swingSpeed[strand] += (away * POINTER_SHOVE * closeness * closeness + pointer.vx * POINTER_DRAG * closeness) * reach * dt;
    };

    const brush = (pointer: Pointer, dt: number) => {
        if (!pointer.active) return;
        for (let strand = 0; strand < count; strand++) shoveStrand(strand, pointer, dt);
    };

    /** Lays every strand out from its (possibly swaying) anchor. */
    const pose = (anchor: (strand: number, out: Point) => Point) => {
        const root = { x: 0, y: 0 };
        for (let strand = 0; strand < count; strand++) {
            anchor(strand, root);
            const first = starts[strand];
            const segments = starts[strand + 1] - first - 1;
            const step = segmentLength[strand];
            const hook = specs[strand].hook;
            let px = root.x;
            let py = root.y;
            x[first] = px;
            y[first] = py;
            for (let segment = 1; segment <= segments; segment++) {
                const share = (segment - 0.5) / segments;
                const straighten = Math.max(0, 1 - share / HOOK_SHARE);
                const angle = hook * straighten * straighten + swing[strand] + curl[strand] * share;
                px += Math.sin(angle) * step;
                py += Math.cos(angle) * step;
                x[first + segment] = px;
                y[first + segment] = py;
            }
        }
    };

    /** A point a given share of the way down a strand. */
    const pointAt = (strand: number, share: number, out: Point) => {
        const first = starts[strand];
        const position = share * (starts[strand + 1] - first - 1);
        const index = Math.min(starts[strand + 1] - 2, Math.floor(position));
        const t = position - index;
        out.x = x[first + index] + (x[first + index + 1] - x[first + index]) * t;
        out.y = y[first + index] + (y[first + index + 1] - y[first + index]) * t;
        return out;
    };

    return { specs, count, starts, x, y, prime, step, brush, pose, pointAt };
}

export type Curtain = ReturnType<typeof createCurtain>;
