const LATTICE_SIZE = 256;
const LATTICE_MASK = LATTICE_SIZE - 1;

const buildLattice = () => {
    const lattice = new Float32Array(LATTICE_SIZE * LATTICE_SIZE);
    for (let k = 0; k < lattice.length; k++) {
        const x = Math.sin(k * 157.31 + (k >> 8) * 113.97) * 43758.5453;
        lattice[k] = x - Math.floor(x);
    }
    return lattice;
};

const LATTICE = buildLattice();

const latticeAt = (i: number, j: number) => LATTICE[((j & LATTICE_MASK) << 8) | (i & LATTICE_MASK)];

const fade = (u: number) => u * u * (3 - 2 * u);

export const valueNoise = (x: number, y: number, periodX: number) => {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = fade(x - i), fy = fade(y - j);
    const i0 = ((i % periodX) + periodX) % periodX, i1 = (i0 + 1) % periodX;
    const a = latticeAt(i0, j), b = latticeAt(i1, j);
    const c = latticeAt(i0, j + 1), d = latticeAt(i1, j + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
