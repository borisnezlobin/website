import { Vector3 } from "three";
import { buildBolt, createBoltShape, type BoltShape } from "./lightning";
import type { PolyActor } from "./polyhedron-actor";
import { strike } from "./reaction";
import type { WhaleActor } from "./whale-actor";

export type Strikable = WhaleActor | PolyActor;

export type Zap = {
    shape: BoltShape;
    /** Bumped whenever the bolt is regrown, so skins only re-upload when it changed. */
    version: number;
    /** 0 is invisible; flickers during the strike and fades through the afterglow. */
    core: number;
    glow: number;
};

export type ZapDirector = {
    zap: Zap;
    glitch: number;
    glitchSeed: number;
    update: (dt: number) => void;
    trigger: (target?: Strikable) => void;
};

const STRIKE = 0.3;
const AFTERGLOW = 0.6;
const GLITCH = 0.15;
const REGROW_EVERY = 1 / 28;
const NEAREST_SOURCES = 3;

type Arc = { from: Strikable; to: Strikable; fromLocal: Vector3; toLocal: Vector3 };

const nextDelay = () => 1.5 + Math.random() * 2.5;
const scratch = { a: new Vector3(), b: new Vector3(), c: new Vector3() };

function isAllowedPair(a: Strikable, b: Strikable) {
    return a !== b && !(a.kind === "whale" && b.kind === "whale");
}

function chooseSource(target: Strikable, actors: Strikable[], visible: (actor: Strikable) => boolean): Strikable | undefined {
    const at = target.center(new Vector3());
    const ranked = actors
        .filter((actor) => isAllowedPair(actor, target) && visible(actor))
        .map((actor) => ({ actor, distance: actor.center(scratch.c).distanceTo(at) }))
        .sort((x, y) => x.distance - y.distance)
        .slice(0, NEAREST_SOURCES);
    return ranked[Math.floor(Math.random() * ranked.length)]?.actor;
}

function anchorPoints(from: Strikable, to: Strikable): Arc {
    const toCenter = to.center(new Vector3());
    const fromPoint = from.kind === "whale" ? from.surfacePoint(new Vector3()) : from.surfacePoint(new Vector3(), toCenter);
    const toPoint = to.kind === "whale" ? to.surfacePoint(new Vector3()) : to.surfacePoint(new Vector3(), fromPoint);
    return { from, to, fromLocal: from.root.worldToLocal(fromPoint), toLocal: to.root.worldToLocal(toPoint) };
}

function flickerLevel(age: number) {
    if (age < STRIKE) return Math.random() < 0.18 ? 0.12 : 0.65 + Math.random() * 0.35;
    const fade = 1 - (age - STRIKE) / AFTERGLOW;
    return Math.max(0, fade) ** 2 * 0.55;
}

/** Fires a bolt every 1.5 to 4 seconds between a whale and a solid, or two solids, that are both on screen. */
export function createZapDirector(actors: Strikable[], visible: (actor: Strikable) => boolean): ZapDirector {
    const zap: Zap = { shape: createBoltShape(), version: 0, core: 0, glow: 0 };
    let arc: Arc | null = null;
    let age = 99;
    let sinceRegrow = 0;
    let untilNext = 1.1;

    function regrow(current: Arc) {
        const from = current.from.root.localToWorld(scratch.a.copy(current.fromLocal));
        const to = current.to.root.localToWorld(scratch.b.copy(current.toLocal));
        buildBolt(from, to, Math.random, zap.shape);
        zap.version += 1;
        sinceRegrow = 0;
    }

    function fire(target: Strikable) {
        const source = chooseSource(target, actors, visible);
        if (!source) return;
        arc = anchorPoints(source, target);
        age = 0;
        regrow(arc);
        const direction = target.center(scratch.a).sub(source.center(scratch.b)).normalize();
        strike(target.reaction, direction, 1);
        source.reaction.flash = Math.max(source.reaction.flash, 0.6);
    }

    function randomTarget() {
        const candidates = actors.filter(visible);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const director: ZapDirector = {
        zap,
        glitch: 0,
        glitchSeed: 0,
        update: (dt) => {
            age += dt;
            sinceRegrow += dt;
            untilNext -= dt;
            if (untilNext <= 0) director.trigger();
            if (arc && age < STRIKE && sinceRegrow >= REGROW_EVERY) regrow(arc);
            zap.core = arc ? flickerLevel(age) : 0;
            zap.glow = arc ? Math.min(1, zap.core * 1.4) : 0;
            director.glitch = age < GLITCH ? 0.6 + Math.random() * 0.4 : 0;
            if (sinceRegrow === 0) director.glitchSeed = Math.random() * 100;
        },
        trigger: (target) => {
            untilNext = nextDelay();
            const chosen = target ?? randomTarget();
            if (chosen) fire(chosen);
        },
    };
    return director;
}
