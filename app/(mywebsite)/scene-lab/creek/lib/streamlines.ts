import type { FlowGrid } from "./flow-grid";
import { advectScalar, createScalarField, type ScalarField } from "./scalar-field";

/**
 * Two fields that draw the flow the way a fluids textbook does.
 *
 * The stream function ψ: in 2D incompressible flow the velocity is (∂ψ/∂y, -∂ψ/∂x), so lines of
 * constant ψ are streamlines. Integrating the downstream velocity across each row from the left
 * bank gives ψ directly (stone has no velocity, so ψ stays constant across a rock, as it should).
 * Dividing by the row's total gives the share of the creek's water flowing to the left of each
 * point, so evenly spaced levels are tubes carrying equal flow: they crowd together where the water
 * runs fast and close into rings where an eddy turns.
 *
 * The travel time: how long the water at each point has been in the creek, carried along by the
 * flow and growing by one second per second. Dashes drawn at fixed travel times ride downstream at
 * exactly the water's speed and stretch where it accelerates.
 */
export type Streamlines = {
    psi: Float32Array;
    travel: ScalarField;
    update: (steps: number, delta: number) => void;
};

const PSI_EASE = 0.35;
const MIN_FLUX = 1e-4;

function integrateRow(grid: FlowGrid, row: number, raw: Float32Array) {
    const { cols, flow } = grid;
    let flux = 0;
    for (let i = 0, k = row * cols; i < cols; i++, k++) {
        if (!flow.solid[k]) flux += flow.uy[k];
        raw[k] = flux;
    }
    return flux;
}

export function createStreamlines(grid: FlowGrid): Streamlines {
    const { cols, rows, flow } = grid;
    const cells = cols * rows;
    const psi = new Float32Array(cells);
    const raw = new Float32Array(cells);
    const travel = createScalarField(cells);
    let primed = false;

    const measurePsi = () => {
        for (let j = 0; j < rows; j++) {
            const flux = integrateRow(grid, j, raw);
            if (Math.abs(flux) < MIN_FLUX) continue;
            const ease = primed ? PSI_EASE : 1;
            for (let i = 0, k = j * cols; i < cols; i++, k++) psi[k] += (raw[k] / flux - psi[k]) * ease;
        }
        primed = true;
    };

    const age = (delta: number) => {
        const values = travel.values;
        for (let k = 0; k < cells; k++) values[k] = flow.solid[k] ? 0 : values[k] + delta;
        for (let i = 0; i < cols; i++) values[i] = 0;
    };

    return {
        psi,
        travel,
        update: (steps, delta) => {
            if (steps === 0) return;
            measurePsi();
            advectScalar(travel, flow, steps, 1);
            age(delta);
        },
    };
}
