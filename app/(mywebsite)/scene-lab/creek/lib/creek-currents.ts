import { ROCK, WATER } from "./creek-layout";
import type { FlowGrid } from "./flow-grid";
import { advectScalar, createScalarField, splat, type ScalarField } from "./scalar-field";
import { createBubbleSwarm, updateBubbles, type BubbleSwarm } from "./bubbles";

/**
 * What the water carries on top of the velocity field: foam whipped up where the water spins or
 * breaks against rock, and the bubbles that foam lets go of.
 */
export type CreekCurrents = {
    foam: ScalarField;
    bubbles: BubbleSwarm;
    update: (steps: number, delta: number) => void;
    stir: (x: number, y: number, amount: number) => void;
};

const FOAM_SPIN_THRESHOLD = 0.75;
const FOAM_SPIN_GAIN = 0.05;
const FOAM_CRASH_THRESHOLD = 1.25;
const FOAM_CRASH_GAIN = 0.05;
/** Share of foam left after one lattice step: it lasts a few seconds, long enough to trail off a rock. */
const FOAM_KEEP_PER_STEP = 0.9955;
/** Water breaking on any rock face always whips up a little foam, which the current drags into the wake. */
const FOAM_FACE_GAIN = 0.012;

const markRockFaces = (grid: FlowGrid) => {
    const { cols, rows, mask } = grid;
    const faces = new Uint8Array(cols * rows);
    for (let k = cols; k < cols * (rows - 1); k++) {
        if (mask.kind[k] !== WATER) continue;
        const touches = mask.kind[k - 1] === ROCK || mask.kind[k + 1] === ROCK || mask.kind[k - cols] === ROCK || mask.kind[k + cols] === ROCK;
        faces[k] = touches ? 1 : 0;
    }
    return faces;
};

export function createCreekCurrents(grid: FlowGrid, bubbleCapacity = 220): CreekCurrents {
    const { flow, cols, rows } = grid;
    const cells = cols * rows;
    const foam = createScalarField(cells);
    const bubbles = createBubbleSwarm(bubbleCapacity);
    const rockFaces = markRockFaces(grid);

    const whipFoam = (steps: number) => {
        const { curl, ux, uy, inflowSpeed } = flow;
        const values = foam.values;
        for (let k = 0; k < cells; k++) {
            const spin = Math.max(0, Math.abs(curl[k]) / inflowSpeed - FOAM_SPIN_THRESHOLD) * FOAM_SPIN_GAIN;
            const crash = rockFaces[k] ? FOAM_FACE_GAIN + Math.max(0, Math.hypot(ux[k], uy[k]) / inflowSpeed - FOAM_CRASH_THRESHOLD) * FOAM_CRASH_GAIN : 0;
            values[k] = Math.min(1, values[k] + (spin + crash) * steps);
        }
    };

    return {
        foam, bubbles,
        update: (steps, delta) => {
            if (steps === 0) return;
            flow.updateCurl();
            whipFoam(steps);
            advectScalar(foam, flow, steps, FOAM_KEEP_PER_STEP ** steps);
            updateBubbles(bubbles, flow, foam.values, steps, delta);
        },
        stir: (x, y, amount) => splat(foam, flow, x, y, 2.2, amount),
    };
}
