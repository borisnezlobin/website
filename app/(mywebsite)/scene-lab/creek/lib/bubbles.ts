import { sampleField, type LatticeFlow } from "./lattice-flow";

/**
 * Air bubbles caught in the current. They are born in whitewater, ride the flow, swell a little
 * as they surface and then pop. Positions are in lattice cells.
 */
export type Bubble = { x: number; y: number; age: number; life: number; size: number; seed: number };

export type BubbleSwarm = { bubbles: Bubble[]; capacity: number };

export const createBubbleSwarm = (capacity: number): BubbleSwarm => ({ bubbles: [], capacity });

/** 0..1 through a bubble's life; past 1 it is popping. */
export const bubblePhase = (bubble: Bubble) => bubble.age / bubble.life;

export const POP_SECONDS = 0.28;

const isSubmerged = (flow: LatticeFlow, x: number, y: number) => {
    const i = x | 0, j = y | 0;
    if (i < 0 || j < 0 || i >= flow.cols || j >= flow.rows) return false;
    return flow.solid[j * flow.cols + i] === 0;
};

function spawnFromFoam(swarm: BubbleSwarm, flow: LatticeFlow, foam: Float32Array, tries: number) {
    for (let t = 0; t < tries && swarm.bubbles.length < swarm.capacity; t++) {
        const x = Math.random() * flow.cols, y = Math.random() * flow.rows;
        const k = (y | 0) * flow.cols + (x | 0);
        if (flow.solid[k] || foam[k] < 0.25 || Math.random() > foam[k]) continue;
        swarm.bubbles.push({ x, y, age: 0, life: 1.2 + Math.random() * 3.2, size: Math.random(), seed: Math.random() });
    }
}

function moveBubble(bubble: Bubble, flow: LatticeFlow, steps: number, delta: number) {
    const { ux, uy, cols, rows } = flow;
    const vx = sampleField(ux, cols, rows, bubble.x, bubble.y);
    const vy = sampleField(uy, cols, rows, bubble.x, bubble.y);
    const wobble = Math.sin(bubble.age * 9 + bubble.seed * 40) * 0.04;
    bubble.x += (vx + wobble) * steps * 0.92;
    bubble.y += vy * steps * 0.92;
    bubble.age += delta;
}

const isAlive = (bubble: Bubble, flow: LatticeFlow) =>
    bubble.age < bubble.life + POP_SECONDS && isSubmerged(flow, bubble.x, bubble.y);

export function updateBubbles(swarm: BubbleSwarm, flow: LatticeFlow, foam: Float32Array, steps: number, delta: number) {
    spawnFromFoam(swarm, flow, foam, 40);
    for (const bubble of swarm.bubbles) moveBubble(bubble, flow, steps, delta);
    swarm.bubbles = swarm.bubbles.filter((bubble) => isAlive(bubble, flow));
}
