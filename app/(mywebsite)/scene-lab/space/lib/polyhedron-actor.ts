import { Euler, Group, Quaternion, Vector3 } from "three";
import { buildPolyShape, type PolyKind, type PolyShape } from "./polyhedron-shape";
import type { LineSet } from "./star-geometry";
import { createReaction, stepReaction, type Reaction } from "./reaction";

export type PolyPlacement = {
    kind: PolyKind;
    /** x and y as fractions of the half-frame at this depth, so the layout survives any aspect. */
    frame: { x: number; y: number };
    depth: number;
    size: number;
    spin: Vector3;
    driftPhase: number;
};

export type PolyActor = {
    kind: "poly";
    root: Group;
    shape: PolyShape;
    placement: PolyPlacement;
    reaction: Reaction;
    anchor: Vector3;
    /** The shape as drawn this frame, in the root's space; bumps `version` whenever it moves. */
    positions: Float32Array;
    lines: Record<LineSet, Float32Array>;
    version: number;
    update: (dt: number, time: number) => void;
    surfacePoint: (target: Vector3, toward: Vector3) => Vector3;
    center: (target: Vector3) => Vector3;
};

const hash = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
};

const scratch = { offset: new Vector3(), spin: new Quaternion(), tilt: new Quaternion(), euler: new Euler(), axis: new Vector3() };

/** Each piece flies out along its own direction, shrinks, and slips sideways in its own slice. */
function pieceOffsets(shape: PolyShape, amount: number, seed: number): Vector3[] {
    return shape.pieces.map(({ direction }, i) => {
        const push = amount * (0.25 + 0.9 * hash(i + seed));
        const slip = amount * (hash(i * 3.7 + seed) - 0.5) * 1.4;
        return direction.clone().multiplyScalar(push).add(new Vector3(slip, 0, 0));
    });
}

function displace(rest: Float32Array, pieceOf: Uint16Array, shape: PolyShape, offsets: Vector3[], shrink: number, out: Float32Array) {
    for (let v = 0; v < pieceOf.length; v += 1) {
        const piece = pieceOf[v];
        const center = shape.pieces[piece].center;
        const offset = offsets[piece];
        out[v * 3] = center.x + (rest[v * 3] - center.x) * shrink + offset.x;
        out[v * 3 + 1] = center.y + (rest[v * 3 + 1] - center.y) * shrink + offset.y;
        out[v * 3 + 2] = center.z + (rest[v * 3 + 2] - center.z) * shrink + offset.z;
    }
}

function applyBreakdown(actor: PolyActor, amount: number) {
    const { shape, reaction } = actor;
    const offsets = pieceOffsets(shape, amount, reaction.seed);
    const shrink = 1 - 0.35 * amount;
    displace(shape.positions, shape.vertexPiece, shape, offsets, shrink, actor.positions);
    displace(shape.lines.detail.positions, shape.lines.detail.pieces, shape, offsets, shrink, actor.lines.detail);
    displace(shape.lines.frame.positions, shape.lines.frame.pieces, shape, offsets, shrink, actor.lines.frame);
    actor.version += 1;
}

export function createPolyActor(placement: PolyPlacement): PolyActor {
    const shape = buildPolyShape(placement.kind);
    const root = new Group();
    root.scale.setScalar(placement.size);
    const orientation = new Quaternion().setFromEuler(new Euler(placement.driftPhase, placement.driftPhase * 2, 0));
    let wasBroken = false;

    const actor: PolyActor = {
        kind: "poly",
        root,
        shape,
        placement,
        reaction: createReaction(),
        anchor: new Vector3(),
        positions: shape.positions.slice(),
        lines: { detail: shape.lines.detail.positions.slice(), frame: shape.lines.frame.positions.slice() },
        version: 0,
        update: (dt, time) => {
            const { reaction } = actor;
            stepReaction(reaction, dt);
            const angle = placement.spin.length() * dt;
            scratch.axis.copy(placement.spin).normalize();
            orientation.multiply(scratch.spin.setFromAxisAngle(scratch.axis, angle));
            scratch.euler.set(reaction.tilt.x * 2, reaction.tilt.y * 2, reaction.tilt.z * 2);
            root.quaternion.copy(orientation).multiply(scratch.tilt.setFromEuler(scratch.euler));
            const phase = placement.driftPhase + time * 0.21;
            scratch.offset.set(Math.sin(phase) * 0.9, Math.sin(phase * 1.3 + 1) * 1.2, Math.cos(phase * 0.8) * 0.7);
            root.position.copy(actor.anchor).add(scratch.offset).add(reaction.offset);
            const broken = reaction.breakdown > 0.001;
            if (broken || wasBroken) applyBreakdown(actor, reaction.breakdown);
            wasBroken = broken;
        },
        surfacePoint: (target, toward) => {
            const center = root.getWorldPosition(target);
            scratch.offset.subVectors(toward, center).normalize().multiplyScalar(placement.size * shape.radius * 0.6);
            return target.add(scratch.offset);
        },
        center: (target) => root.getWorldPosition(target),
    };
    return actor;
}
