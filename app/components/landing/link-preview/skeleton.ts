/** A binary image cut to a box, one byte per pixel. */
export type Bitmap = { width: number; height: number; left: number; top: number; on: Uint8Array };

const NEIGHBOURS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]] as const;

const at = (map: Bitmap, x: number, y: number) => (x < 0 || y < 0 || x >= map.width || y >= map.height ? 0 : map.on[y * map.width + x]);

/** The eight neighbours clockwise from north, as P2..P9 in Zhang and Suen's paper. */
function ring(map: Bitmap, x: number, y: number) {
    return NEIGHBOURS.map(([dx, dy]) => at(map, x + dx, y + dy));
}

function transitions(p: number[]) {
    let count = 0;
    for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) count++;
    return count;
}

/** Which neighbour triples must not all be filled, for each of the two sub-passes. */
const GUARDS = [
    [[0, 2, 4], [2, 4, 6]],
    [[0, 2, 6], [0, 4, 6]],
] as const;

const allFilled = (p: number[], triple: readonly number[]) => triple.every((k) => p[k] === 1);

function removable(p: number[], pass: number) {
    const filled = p.reduce((sum, value) => sum + value, 0);
    const thinEnough = filled >= 2 && filled <= 6;
    return thinEnough && transitions(p) === 1 && !GUARDS[pass].some((triple) => allFilled(p, triple));
}

/** Zhang-Suen thinning: peels the strokes one pixel at a time until only their centre lines are left. */
export function thin(source: Bitmap): Bitmap {
    const map = { ...source, on: source.on.slice() };
    let changed = true;
    while (changed) {
        changed = false;
        for (let pass = 0; pass < 2; pass++) {
            const doomed: number[] = [];
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    if (map.on[y * map.width + x] && removable(ring(map, x, y), pass)) doomed.push(y * map.width + x);
                }
            }
            doomed.forEach((index) => { map.on[index] = 0; });
            changed ||= doomed.length > 0;
        }
    }
    return map;
}

export function neighboursOf(map: Bitmap, index: number) {
    const x = index % map.width, y = Math.floor(index / map.width);
    const found: number[] = [];
    for (const [dx, dy] of NEIGHBOURS) if (at(map, x + dx, y + dy)) found.push((y + dy) * map.width + x + dx);
    return found;
}
