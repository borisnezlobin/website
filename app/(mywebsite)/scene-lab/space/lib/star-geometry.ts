import { Vector3 } from "three";

/** Material slots of a battle-room star, in the order every look supplies its materials. */
export const SURFACE_PARTS = ["panel", "bevel", "ring", "inset", "light"] as const;
export type SurfacePart = (typeof SURFACE_PARTS)[number];
export type LineSet = "detail" | "frame";

export type Piece = { center: Vector3; direction: Vector3 };
type Tri = [Vector3, Vector3, Vector3];

/** Triangles per material and segments per line set, each tagged with the piece it flies apart with. */
export type ShapeDraft = {
    triangles: Record<SurfacePart, { vertices: Vector3[]; pieces: number[] }>;
    lines: Record<LineSet, { vertices: Vector3[]; pieces: number[] }>;
    pieces: Piece[];
};

export const APEX = 1.18;
const BEVEL = 0.055;
const FRAME_KEEP = 0.7;
const RECESS_KEEP = 0.665;
const RECESS_DEPTH = 0.035;
const LIGHT_RADIUS = 0.034;

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export function createDraft(): ShapeDraft {
    const empty = () => ({ vertices: [] as Vector3[], pieces: [] as number[] });
    return {
        triangles: { panel: empty(), bevel: empty(), ring: empty(), inset: empty(), light: empty() },
        lines: { detail: empty(), frame: empty() },
        pieces: [],
    };
}

const normalOf = ([a, b, c]: Tri) => new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
const centroid = (points: Vector3[]) => points.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(points.length);

function outward(tri: Tri, solidCenter: Vector3): Tri {
    const facing = normalOf(tri).dot(new Vector3().subVectors(centroid(tri), solidCenter));
    return facing >= 0 ? tri : [tri[0], tri[2], tri[1]];
}

function incircle([a, b, c]: Tri) {
    const [la, lb, lc] = [b.distanceTo(c), c.distanceTo(a), a.distanceTo(b)];
    const perimeter = la + lb + lc;
    const center = new Vector3().addScaledVector(a, la).addScaledVector(b, lb).addScaledVector(c, lc).divideScalar(perimeter);
    const area = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).length() / 2;
    return { center, radius: (2 * area) / perimeter };
}

const scaleAbout = (tri: Tri, center: Vector3, k: number) => tri.map((p) => center.clone().lerp(p, k)) as Tri;

function addTriangle(draft: ShapeDraft, part: SurfacePart, tri: Tri, piece: number, solidCenter: Vector3) {
    draft.triangles[part].vertices.push(...outward(tri, solidCenter));
    draft.triangles[part].pieces.push(piece);
}

function addQuad(draft: ShapeDraft, part: SurfacePart, [a, b, c, d]: Vector3[], piece: number, solidCenter: Vector3) {
    addTriangle(draft, part, [a, b, c], piece, solidCenter);
    addTriangle(draft, part, [a, c, d], piece, solidCenter);
}

function addLoop(draft: ShapeDraft, set: LineSet, points: Vector3[], piece: number) {
    points.forEach((p, i) => {
        draft.lines[set].vertices.push(p, points[(i + 1) % points.length]);
        draft.lines[set].pieces.push(piece);
    });
}

function addPiece(draft: ShapeDraft, center: Vector3, direction: Vector3) {
    draft.pieces.push({ center, direction: direction.clone().normalize() });
    return draft.pieces.length - 1;
}

/** A light frame of panel, a sloped glowing edge, and a dark triangle recessed into the middle. */
function addPanel(draft: ShapeDraft, face: Tri, solidCenter: Vector3): Tri {
    const { center, radius } = incircle(face);
    const normal = normalOf(outward(face, solidCenter));
    const panelScale = 1 - BEVEL / radius;
    const outer = scaleAbout(face, center, panelScale);
    const inner = scaleAbout(face, center, panelScale * FRAME_KEEP);
    const recessed = scaleAbout(face, center, panelScale * RECESS_KEEP).map((p) => p.addScaledVector(normal, -RECESS_DEPTH)) as Tri;
    const piece = addPiece(draft, center, normal);
    for (let i = 0; i < 3; i += 1) {
        const j = (i + 1) % 3;
        addQuad(draft, "panel", [outer[i], outer[j], inner[j], inner[i]], piece, solidCenter);
        addQuad(draft, "ring", [inner[i], inner[j], recessed[j], recessed[i]], piece, solidCenter);
    }
    addTriangle(draft, "inset", recessed, piece, solidCenter);
    addLoop(draft, "detail", outer, piece);
    addLoop(draft, "detail", inner, piece);
    return outer;
}

function addLight(draft: ShapeDraft, at: Vector3, axis: Vector3, piece: number) {
    const tip = at.clone().addScaledVector(axis, LIGHT_RADIUS * 1.4);
    const side = new Vector3(axis.y, axis.z, axis.x).cross(axis).normalize().multiplyScalar(LIGHT_RADIUS);
    const up = new Vector3().crossVectors(axis, side).normalize().multiplyScalar(LIGHT_RADIUS);
    const ring = [side, up, side.clone().negate(), up.clone().negate()].map((offset) => at.clone().add(offset));
    ring.forEach((p, i) => addTriangle(draft, "light", [p, ring[(i + 1) % 4], tip], piece, at));
}

type Solid = { vertices: Vector3[]; faces: [number, number, number][] };

function bipyramid(): Solid {
    return {
        vertices: [v(1, 0, 0), v(0, 0, -1), v(-1, 0, 0), v(0, 0, 1), v(0, APEX, 0), v(0, -APEX, 0)],
        faces: [0, 1, 2, 3].flatMap((i) => [
            [i, (i + 1) % 4, 4],
            [(i + 1) % 4, i, 5],
        ]) as [number, number, number][],
    };
}

function addBevels(draft: ShapeDraft, solid: Solid, outers: Tri[], center: Vector3) {
    solid.faces.forEach((face, f) => {
        solid.faces.forEach((other, g) => {
            if (g <= f) return;
            const shared = face.filter((index) => other.includes(index));
            if (shared.length !== 2) return;
            const [a, b] = shared.map((index) => solid.vertices[index]);
            const corner = (tri: Tri, owner: number[], index: number) => tri[owner.indexOf(index)];
            const quad = [corner(outers[f], face, shared[0]), corner(outers[f], face, shared[1]), corner(outers[g], other, shared[1]), corner(outers[g], other, shared[0])];
            const piece = addPiece(draft, centroid(quad), new Vector3().addVectors(a, b).multiplyScalar(0.5).sub(center));
            addQuad(draft, "bevel", quad, piece, center);
            draft.lines.frame.vertices.push(a, b);
            draft.lines.frame.pieces.push(piece);
        });
    });
}

function capRing(solid: Solid, outers: Tri[], index: number, axis: Vector3) {
    const corners = solid.faces.flatMap((face, f) => (face.includes(index) ? [outers[f][face.indexOf(index)]] : []));
    const middle = centroid(corners);
    const reference = new Vector3().subVectors(corners[0], middle).normalize();
    const across = new Vector3().crossVectors(axis, reference);
    const angle = (p: Vector3) => {
        const d = new Vector3().subVectors(p, middle);
        return Math.atan2(d.dot(across), d.dot(reference));
    };
    return { middle, corners: corners.sort((p, q) => angle(p) - angle(q)) };
}

const LIT_VERTICES = new Set([0, 2]);

function addCaps(draft: ShapeDraft, solid: Solid, outers: Tri[], center: Vector3) {
    solid.vertices.forEach((vertex, index) => {
        const axis = new Vector3().subVectors(vertex, center).normalize();
        const { middle, corners } = capRing(solid, outers, index, axis);
        const piece = addPiece(draft, middle, axis);
        corners.forEach((p, i) => addTriangle(draft, "bevel", [middle, p, corners[(i + 1) % corners.length]], piece, center));
        addLoop(draft, "detail", corners, piece);
        if (LIT_VERTICES.has(index)) addLight(draft, middle, axis, piece);
    });
}

/** One chamfered square bipyramid, unit equator, apex at ±APEX. */
export function addStar(draft: ShapeDraft) {
    const solid = bipyramid();
    const center = new Vector3();
    const outers = solid.faces.map((face) => addPanel(draft, face.map((i) => solid.vertices[i]) as Tri, center));
    addBevels(draft, solid, outers, center);
    addCaps(draft, solid, outers, center);
}
