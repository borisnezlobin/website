import { Vector3 } from "three";

/** Segment pairs (x0 y0 z0 x1 y1 z1) for the trunk and for the forks plus impact sparks. */
export type BoltShape = {
    trunk: Float32Array;
    trunkCount: number;
    forks: Float32Array;
    forkCount: number;
};

const TRUNK_DEPTH = 5;
const FORK_DEPTH = 4;
const MAX_FORKS = 5;
const SPARKS = 7;
export const TRUNK_CAPACITY = 2 ** TRUNK_DEPTH;
export const FORK_CAPACITY = MAX_FORKS * 2 ** FORK_DEPTH + SPARKS;

export function createBoltShape(): BoltShape {
    return { trunk: new Float32Array(TRUNK_CAPACITY * 6), trunkCount: 0, forks: new Float32Array(FORK_CAPACITY * 6), forkCount: 0 };
}

function perpendicular(direction: Vector3, random: () => number) {
    const v = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
    return v.addScaledVector(direction, -v.dot(direction)).normalize();
}

/** Midpoint displacement: each pass splits every segment and kicks the midpoint sideways, half as hard as the pass before. */
function jaggedPath(from: Vector3, to: Vector3, depth: number, roughness: number, random: () => number): Vector3[] {
    let points = [from.clone(), to.clone()];
    let kick = from.distanceTo(to) * roughness;
    const direction = new Vector3().subVectors(to, from).normalize();
    for (let pass = 0; pass < depth; pass += 1) {
        const next: Vector3[] = [points[0]];
        for (let i = 1; i < points.length; i += 1) {
            const mid = points[i - 1].clone().lerp(points[i], 0.5);
            mid.addScaledVector(perpendicular(direction, random), kick * (random() - 0.5) * 2);
            next.push(mid, points[i]);
        }
        points = next;
        kick *= 0.56;
    }
    return points;
}

function writePath(points: Vector3[], out: Float32Array, start: number): number {
    let count = start;
    for (let i = 1; i < points.length; i += 1) {
        points[i - 1].toArray(out, count * 6);
        points[i].toArray(out, count * 6 + 3);
        count += 1;
    }
    return count;
}

function forkTip(trunk: Vector3[], index: number, span: number, random: () => number) {
    const along = new Vector3().subVectors(trunk[Math.min(index + 2, trunk.length - 1)], trunk[index]).normalize();
    const sideways = perpendicular(along, random).multiplyScalar(0.9);
    return trunk[index].clone().addScaledVector(along.add(sideways).normalize(), span * (0.12 + random() * 0.22));
}

function sparkSegments(at: Vector3, span: number, out: Float32Array, start: number, random: () => number) {
    let count = start;
    for (let i = 0; i < SPARKS; i += 1) {
        const ray = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
        const inner = at.clone().addScaledVector(ray, span * 0.015);
        const outer = at.clone().addScaledVector(ray, span * (0.04 + random() * 0.06));
        inner.toArray(out, count * 6);
        outer.toArray(out, count * 6 + 3);
        count += 1;
    }
    return count;
}

export function buildBolt(from: Vector3, to: Vector3, random: () => number, out: BoltShape) {
    const span = from.distanceTo(to);
    const trunk = jaggedPath(from, to, TRUNK_DEPTH, 0.3, random);
    out.trunkCount = writePath(trunk, out.trunk, 0);
    let forks = 0;
    const forkCount = 2 + Math.floor(random() * (MAX_FORKS - 1));
    for (let i = 0; i < forkCount; i += 1) {
        const index = 3 + Math.floor(random() * (trunk.length - 8));
        const tip = forkTip(trunk, index, span, random);
        forks = writePath(jaggedPath(trunk[index], tip, FORK_DEPTH, 0.3, random), out.forks, forks);
    }
    out.forkCount = sparkSegments(to, span, out.forks, forks, random);
}
