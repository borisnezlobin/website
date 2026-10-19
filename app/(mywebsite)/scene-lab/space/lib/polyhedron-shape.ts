import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { addStar, APEX, createDraft, SURFACE_PARTS, type LineSet, type Piece, type ShapeDraft, type SurfacePart } from "./star-geometry";

/** A lone star, four stars tiling a bigger diamond, or a star ringed by six small ones. */
export type PolyKind = "star" | "quad" | "cluster";

export type SegmentSet = { positions: Float32Array; pieces: Uint16Array };

/**
 * A battle-room star as flat, non-indexed triangles sorted into one draw group per surface part, plus
 * two line sets for drawn looks: every panel edge (`detail`) and the plain solid's edges (`frame`).
 * Every vertex belongs to a piece, so a breakdown can fling panels, bevels and caps apart.
 */
export type PolyShape = {
    positions: Float32Array;
    normals: Float32Array;
    vertexPiece: Uint16Array;
    groups: { part: SurfacePart; start: number; count: number }[];
    lines: Record<LineSet, SegmentSet>;
    pieces: Piece[];
    radius: number;
};

type Member = { offset: [number, number, number]; scale: number; turn?: [number, number, number] };

const LAYOUTS: Record<PolyKind, Member[]> = {
    star: [{ offset: [0, 0, 0], scale: 1 }],
    quad: [
        { offset: [0.5, 0, 0], scale: 0.47 },
        { offset: [-0.5, 0, 0], scale: 0.47 },
        { offset: [0, 0.5 * APEX, 0], scale: 0.47 },
        { offset: [0, -0.5 * APEX, 0], scale: 0.47 },
    ],
    cluster: [
        { offset: [0, 0, 0], scale: 0.62 },
        { offset: [1.02, 0, 0], scale: 0.34, turn: [0, 0, Math.PI / 2] },
        { offset: [-1.02, 0, 0], scale: 0.34, turn: [0, 0, Math.PI / 2] },
        { offset: [0, 1.02 * APEX, 0], scale: 0.34 },
        { offset: [0, -1.02 * APEX, 0], scale: 0.34 },
        { offset: [0, 0, 1.02], scale: 0.34, turn: [Math.PI / 2, 0, 0] },
        { offset: [0, 0, -1.02], scale: 0.34, turn: [Math.PI / 2, 0, 0] },
    ],
};

const RADIUS: Record<PolyKind, number> = { star: APEX, quad: APEX, cluster: 1.02 * APEX + 0.34 * APEX };

function memberMatrix({ offset, scale, turn = [0, 0, 0] }: Member) {
    const rotation = new Quaternion().setFromEuler(new Euler(...turn));
    return new Matrix4().compose(new Vector3(...offset), rotation, new Vector3(scale, scale, scale));
}

/** Copies one member's draft into the whole shape; satellites also fly away from the cluster's middle. */
function mergeMember(into: ShapeDraft, member: Member) {
    const draft = createDraft();
    addStar(draft);
    const matrix = memberMatrix(member);
    const rotation = new Matrix4().extractRotation(matrix);
    const away = new Vector3(...member.offset);
    const base = into.pieces.length;
    draft.pieces.forEach(({ center, direction }) => {
        const flung = direction.clone().applyMatrix4(rotation).add(away.clone().multiplyScalar(0.8)).normalize();
        into.pieces.push({ center: center.clone().applyMatrix4(matrix), direction: flung });
    });
    const copy = (source: { vertices: Vector3[]; pieces: number[] }, target: { vertices: Vector3[]; pieces: number[] }) => {
        target.vertices.push(...source.vertices.map((p) => p.clone().applyMatrix4(matrix)));
        target.pieces.push(...source.pieces.map((piece) => piece + base));
    };
    SURFACE_PARTS.forEach((part) => copy(draft.triangles[part], into.triangles[part]));
    (["detail", "frame"] as const).forEach((set) => copy(draft.lines[set], into.lines[set]));
}

function flatNormals(positions: Float32Array) {
    const normals = new Float32Array(positions.length);
    const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()];
    for (let i = 0; i < positions.length; i += 9) {
        a.fromArray(positions, i);
        b.fromArray(positions, i + 3).sub(a);
        c.fromArray(positions, i + 6).sub(a);
        b.cross(c).normalize();
        for (let k = 0; k < 3; k += 1) b.toArray(normals, i + k * 3);
    }
    return normals;
}

function packTriangles(draft: ShapeDraft) {
    const vertices = SURFACE_PARTS.flatMap((part) => draft.triangles[part].vertices);
    const positions = new Float32Array(vertices.length * 3);
    vertices.forEach((p, i) => p.toArray(positions, i * 3));
    const vertexPiece = new Uint16Array(SURFACE_PARTS.flatMap((part) => draft.triangles[part].pieces.flatMap((piece) => [piece, piece, piece])));
    let start = 0;
    const groups = SURFACE_PARTS.map((part) => {
        const count = draft.triangles[part].vertices.length;
        const group = { part, start, count };
        start += count;
        return group;
    });
    return { positions, normals: flatNormals(positions), vertexPiece, groups };
}

function packLines({ vertices, pieces }: { vertices: Vector3[]; pieces: number[] }): SegmentSet {
    const positions = new Float32Array(vertices.length * 3);
    vertices.forEach((p, i) => p.toArray(positions, i * 3));
    return { positions, pieces: new Uint16Array(pieces.flatMap((piece) => [piece, piece])) };
}

export function buildPolyShape(kind: PolyKind): PolyShape {
    const draft = createDraft();
    LAYOUTS[kind].forEach((member) => mergeMember(draft, member));
    return {
        ...packTriangles(draft),
        lines: { detail: packLines(draft.lines.detail), frame: packLines(draft.lines.frame) },
        pieces: draft.pieces,
        radius: RADIUS[kind],
    };
}
