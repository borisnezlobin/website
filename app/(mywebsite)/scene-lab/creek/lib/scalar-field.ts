import type { LatticeFlow } from "./lattice-flow";
import { sampleField } from "./lattice-flow";

/**
 * A quantity carried by the water (dye, foam): each frame every cell looks back along the
 * velocity to where its water came from and takes the value found there (semi-Lagrangian).
 */
export type ScalarField = { values: Float32Array; scratch: Float32Array };

export const createScalarField = (cells: number): ScalarField => ({
    values: new Float32Array(cells),
    scratch: new Float32Array(cells),
});

export function advectScalar(field: ScalarField, flow: LatticeFlow, steps: number, keep: number) {
    const { cols, rows, ux, uy, solid } = flow;
    const { values, scratch } = field;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const k = y * cols + x;
            scratch[k] = solid[k] ? 0 : keep * sampleField(values, cols, rows, x + 0.5 - ux[k] * steps, y + 0.5 - uy[k] * steps);
        }
    }
    field.values = scratch;
    field.scratch = values;
}

export function splat(field: ScalarField, flow: LatticeFlow, x: number, y: number, radius: number, amount: number) {
    const { cols, rows, solid } = flow;
    const reach = Math.ceil(radius * 2);
    for (let j = Math.max(0, Math.floor(y) - reach); j <= Math.min(rows - 1, Math.floor(y) + reach); j++) {
        for (let i = Math.max(0, Math.floor(x) - reach); i <= Math.min(cols - 1, Math.floor(x) + reach); i++) {
            const k = j * cols + i;
            if (solid[k]) continue;
            const add = amount * Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (radius * radius));
            field.values[k] = Math.min(1, field.values[k] + add);
        }
    }
}
