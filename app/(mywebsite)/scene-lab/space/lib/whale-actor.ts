import { AnimationMixer, Euler, Group, Matrix4, Quaternion, Vector3, type Object3D, type SkinnedMesh } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createClipDirector, type ClipDirector } from "./clip-director";
import { createReaction, stepReaction, type Reaction } from "./reaction";
import type { WhaleAsset } from "./whale-asset";

/** A slow closed loop through the volume; the whale faces along it, as the kit's in-place clips expect. */
export type WhaleRoute = {
    center: Vector3;
    radius: Vector3;
    /** Radians per second around the loop; negative swims the other way. */
    speed: number;
    phase: number;
    rollAmplitude: number;
    rollRate: number;
};

export type WhaleActor = {
    kind: "whale";
    root: Group;
    mesh: SkinnedMesh;
    reaction: Reaction;
    route: WhaleRoute;
    update: (dt: number, time: number) => void;
    surfacePoint: (target: Vector3) => Vector3;
    center: (target: Vector3) => Vector3;
    dispose: () => void;
};

const SWIM_TIME_SCALE = 0.62;
const WORLD_UP = new Vector3(0, 1, 0);
const WHALE_FORWARD = new Vector3(1, 0, 0);
const scratch = { forward: new Vector3(), side: new Vector3(), up: new Vector3(), basis: new Matrix4(), roll: new Quaternion(), tilt: new Quaternion(), euler: new Euler() };

function findSkinnedMesh(root: Object3D): SkinnedMesh {
    let found: SkinnedMesh | null = null;
    root.traverse((node) => {
        if ((node as SkinnedMesh).isSkinnedMesh) found ??= node as SkinnedMesh;
    });
    if (!found) throw new Error("whale GLB has no skinned mesh");
    return found;
}

export function routePosition(route: WhaleRoute, time: number, target: Vector3): Vector3 {
    const angle = route.phase + route.speed * time;
    return target.set(
        route.center.x + route.radius.x * Math.cos(angle),
        route.center.y + route.radius.y * Math.sin(angle * 2 + route.phase),
        route.center.z + route.radius.z * Math.sin(angle),
    );
}

function routeHeading(route: WhaleRoute, time: number, target: Vector3): Vector3 {
    const angle = route.phase + route.speed * time;
    const direction = Math.sign(route.speed) || 1;
    return target
        .set(-route.radius.x * Math.sin(angle), 2 * route.radius.y * Math.cos(angle * 2 + route.phase), route.radius.z * Math.cos(angle))
        .multiplyScalar(direction)
        .normalize();
}

/** +X forward, +Y up, +Z the whale's left: build that basis from the heading, then roll about +X. */
function orientAlong(root: Group, heading: Vector3, roll: number, reaction: Reaction) {
    const { forward, side, up, basis } = scratch;
    forward.copy(heading);
    side.crossVectors(forward, WORLD_UP).normalize();
    up.crossVectors(side, forward).normalize();
    basis.makeBasis(forward, up, side);
    root.quaternion.setFromRotationMatrix(basis);
    root.quaternion.multiply(scratch.roll.setFromAxisAngle(WHALE_FORWARD, roll));
    scratch.euler.set(reaction.tilt.x, reaction.tilt.y, reaction.tilt.z);
    root.quaternion.multiply(scratch.tilt.setFromEuler(scratch.euler));
}

export function createWhaleActor(asset: WhaleAsset, route: WhaleRoute, random: () => number): WhaleActor {
    const body = cloneSkinned(asset.scene);
    const root = new Group();
    root.add(body);
    const mesh = findSkinnedMesh(body);
    mesh.frustumCulled = false;
    const mixer = new AnimationMixer(body);
    const director: ClipDirector = createClipDirector(mixer, asset, random);
    const reaction = createReaction();
    const heading = new Vector3();
    const vertexCount = mesh.geometry.getAttribute("position").count;

    return {
        kind: "whale",
        root,
        mesh,
        reaction,
        route,
        update: (dt, time) => {
            stepReaction(reaction, dt);
            director.setStartle(Math.min(1, reaction.flash * 1.6));
            director.update(dt * SWIM_TIME_SCALE);
            mixer.update(dt * SWIM_TIME_SCALE);
            routePosition(route, time, root.position).add(reaction.offset);
            const roll = route.rollAmplitude * Math.sin(time * route.rollRate + route.phase * 3);
            orientAlong(root, routeHeading(route, time, heading), roll, reaction);
        },
        surfacePoint: (target) => {
            mesh.getVertexPosition(Math.floor(Math.random() * vertexCount), target);
            return mesh.localToWorld(target);
        },
        center: (target) => root.getWorldPosition(target),
        dispose: () => {
            mixer.stopAllAction();
            mixer.uncacheRoot(body);
        },
    };
}
