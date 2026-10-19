import type { Point } from "../boids/types";
import type { Arbor, WoodNode } from "./growth";

export type NodeLocator = (node: number, out: Point) => Point;

/** Where a node sits under a given lean: thin wood swings sideways and dips a touch at the ends of the swing. */
export function swayNode(node: WoodNode, lean: number, out: Point) {
    const push = node.flex * lean;
    out.x = node.x + push;
    out.y = node.y + Math.abs(push * lean) * 0.5;
    return out;
}

export function createNodeLocator(arbor: Arbor, leanAt: (x: number) => number): NodeLocator {
    return (index, out) => {
        const node = arbor.nodes[index];
        if (node.flex === 0) {
            out.x = node.x;
            out.y = node.y;
            return out;
        }
        return swayNode(node, leanAt(node.x), out);
    };
}

const COLUMN_WIDTH = 24;
const WOOD_STIFFNESS = 26;
const WOOD_DAMPING = 5;

/**
 * The wind as felt by wood: a row of damped springs across the screen, so twigs lag a gust,
 * overshoot a little and settle, instead of copying the wind exactly.
 */
export function createWoodLean() {
    let lean = new Float32Array(1);
    let speed = new Float32Array(1);

    const resize = (width: number) => {
        const columns = Math.ceil(width / COLUMN_WIDTH) + 2;
        lean = new Float32Array(columns);
        speed = new Float32Array(columns);
    };

    const step = (dt: number, windLean: (x: number) => number) => {
        for (let column = 0; column < lean.length; column++) {
            const force = WOOD_STIFFNESS * (windLean((column - 1) * COLUMN_WIDTH) - lean[column]) - WOOD_DAMPING * speed[column];
            speed[column] += force * dt;
            lean[column] += speed[column] * dt;
        }
    };

    const at = (x: number) => {
        const position = Math.min(lean.length - 1.001, Math.max(0, x / COLUMN_WIDTH + 1));
        const column = Math.floor(position);
        const t = position - column;
        return lean[column] + (lean[column + 1] - lean[column]) * t;
    };

    return { resize, step, at };
}

export type WoodLean = ReturnType<typeof createWoodLean>;
