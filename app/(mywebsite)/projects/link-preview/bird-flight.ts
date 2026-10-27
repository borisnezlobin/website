import type { BirdPose } from "../canopy/boids/draw";
import { restingSpot } from "../canopy/boids/landing";
import type { PerchSite, Point } from "../canopy/boids/types";
import { between, lerpAngle, type Random } from "../canopy/random";
import type { SceneSize } from "../canopy/scene-loop";
import { FLUSH, LOOP_SECONDS, since, span } from "./timeline";

/** A bird that sits out the loop on one perch, except for one lap of the sky after the big gust. */
export type ScriptedBird = {
    site: PerchSite;
    facing: 1 | -1;
    takeOff: number;
    home: number;
    /** Where it sat when it took off; filled in by the simulation. */
    launch: Point;
    spread: number;
    swirl: number;
    swirlRate: number;
    glances: { at: number; lean: number }[];
};

/** The flock's lap, as shares of the frame: up and out to the right, low over the headline, and back up into the tree. */
const LAP = [
    [0.74, 0.08],
    [0.96, 0.4],
    [0.66, 0.64],
    [0.3, 0.62],
    [0.07, 0.38],
    [0.24, 0.1],
] as const;
const MAX_BIRDS = 14;
const GLANCE_SECONDS = 0.5;
const STEP = 0.004;

/** Uniform Catmull-Rom through the points, at u from 0 to 1 along the whole path. */
function catmullRom(points: Point[], u: number, out: Point) {
    const segments = points.length - 1;
    const position = Math.min(segments - 1e-6, Math.max(0, u * segments));
    const index = Math.floor(position);
    const t = position - index;
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(segments, index + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const along = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.x = along(p0.x, p1.x, p2.x, p3.x);
    out.y = along(p0.y, p1.y, p2.y, p3.y);
    return out;
}

function shuffled<T>(random: Random, items: readonly T[]) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function scriptBirds(random: Random, sites: PerchSite[]): ScriptedBird[] {
    const chosen = shuffled(random, sites).slice(0, MAX_BIRDS);
    const pose = { x: 0, y: 0, angle: 0 };
    return chosen.map((site) => {
        site.locate(pose);
        return {
            site,
            facing: site.facing ?? (random() < 0.5 ? 1 : -1),
            takeOff: FLUSH.takeOff + between(random, 0, 0.35),
            home: FLUSH.home - between(random, 0, 0.6),
            launch: { x: pose.x, y: pose.y },
            spread: between(random, 8, 34),
            swirl: random() * Math.PI * 2,
            swirlRate: between(random, -1.5, 1.5),
            glances: Array.from({ length: 2 }, () => ({ at: random() * LOOP_SECONDS, lean: between(random, -0.35, 0.35) })),
        };
    });
}

const rest: Point = { x: 0, y: 0 };

function perchedPose(bird: ScriptedBird, t: number, out: BirdPose) {
    const heading = restingSpot(bird.site, bird.facing, rest);
    const lean = bird.glances.reduce((sum, glance) => sum + glance.lean * Math.sin(Math.PI * span(since(t, glance.at), 0, GLANCE_SECONDS)), 0);
    out.x = rest.x;
    out.y = rest.y;
    out.heading = heading + lean;
    out.stretch = 1;
    return out;
}

function lapPoints(bird: ScriptedBird, size: SceneSize, s: number) {
    const restHeading = restingSpot(bird.site, bird.facing, rest);
    const angle = bird.swirl + bird.swirlRate * s * Math.PI * 2;
    const lap = LAP.map(([x, y]) => ({ x: x * size.width + Math.cos(angle) * bird.spread, y: y * size.height + Math.sin(angle) * bird.spread }));
    const takeOffLift = { x: bird.launch.x + 26, y: bird.launch.y - 40 };
    const approach = { x: rest.x - Math.cos(restHeading) * 46, y: rest.y - 34 };
    return { points: [bird.launch, takeOffLift, ...lap, approach, { ...rest }], restHeading };
}

const ahead: Point = { x: 0, y: 0 };
const behind: Point = { x: 0, y: 0 };

/** One lap of the sky: springs off the perch, follows the flock's loop with its own offset, and settles back facing the way it sat. */
function flyingPose(bird: ScriptedBird, size: SceneSize, s: number, out: BirdPose) {
    const { points, restHeading } = lapPoints(bird, size, s);
    const u = 0.5 - 0.5 * Math.cos(Math.PI * s);
    catmullRom(points, u, out);
    catmullRom(points, Math.min(1, u + STEP), ahead);
    catmullRom(points, Math.max(0, u - STEP), behind);
    const travel = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    const settling = span(s, 0.9, 1);
    out.heading = lerpAngle(travel, restHeading, settling * settling);
    out.stretch = 1 + 0.35 * Math.sin(Math.PI * s) * (1 - settling);
    return out;
}

export function birdPose(bird: ScriptedBird, size: SceneSize, t: number, out: BirdPose) {
    const flight = bird.home - bird.takeOff;
    const age = since(t, bird.takeOff);
    if (age >= flight) return perchedPose(bird, t, out);
    return flyingPose(bird, size, age / flight, out);
}
