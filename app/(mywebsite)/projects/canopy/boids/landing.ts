import { lerp, lerpAngle, smoothstep } from "../random";
import type { Bird, PerchPose, PerchSite, Point } from "./types";

/** Half the triangle's width, so it sits on the bark instead of inside it. */
const SIT_HEIGHT = 3.5;
const STAGING_BEHIND = 74;
const STAGING_BELOW = 56;
const TOUCHDOWN_SPEED = 26;
const SETTLE_SECONDS = 0.42;

const pose: PerchPose = { x: 0, y: 0, angle: 0 };

/** Where the bird's centre rests on a perch right now, and which way it faces along the branch. */
export function restingSpot(site: PerchSite, facing: 1 | -1, out: Point) {
    site.locate(pose);
    out.x = pose.x + Math.sin(pose.angle) * SIT_HEIGHT;
    out.y = pose.y - Math.cos(pose.angle) * SIT_HEIGHT;
    return pose.angle + (facing < 0 ? Math.PI : 0);
}

export function chooseFacing(site: PerchSite, fromX: number) {
    if (site.facing) return site.facing;
    site.locate(pose);
    return (pose.x - fromX) * Math.cos(pose.angle) >= 0 ? 1 : -1;
}

export function beginApproach(bird: Bird, site: PerchSite) {
    site.taken = true;
    bird.perch = site;
    bird.facing = chooseFacing(site, bird.x);
    bird.state = "approaching";
    const speed = Math.hypot(bird.vx, bird.vy) || bird.preferredSpeed;
    bird.path = {
        from: { x: bird.x, y: bird.y },
        pull: { x: bird.x + bird.vx * 0.45, y: bird.y + bird.vy * 0.45 },
        progress: 0,
        speed,
    };
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function cubicSlope(a: number, b: number, c: number, d: number, t: number) {
    const u = 1 - t;
    return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
}

const target: Point = { x: 0, y: 0 };

/**
 * Glides along a curve that dips below and behind the perch, slows down, then pitches the
 * nose up (the flare) just before touching down.
 */
export function approach(bird: Bird, dt: number) {
    const restHeading = restingSpot(bird.perch!, bird.facing, target);
    const forwardX = Math.cos(restHeading);
    const forwardY = Math.sin(restHeading);
    const stagingX = target.x - forwardX * STAGING_BEHIND;
    const stagingY = target.y - forwardY * STAGING_BEHIND + STAGING_BELOW;
    const { from, pull } = bird.path;
    const t = bird.path.progress;

    const slopeX = cubicSlope(from.x, pull.x, stagingX, target.x, t);
    const slopeY = cubicSlope(from.y, pull.y, stagingY, target.y, t);
    const speed = lerp(bird.path.speed, TOUCHDOWN_SPEED, smoothstep(0.3, 1, t));
    bird.path.progress = Math.min(1, t + (speed * dt) / (Math.hypot(slopeX, slopeY) || 1));

    const next = bird.path.progress;
    bird.x = cubic(from.x, pull.x, stagingX, target.x, next);
    bird.y = cubic(from.y, pull.y, stagingY, target.y, next);
    const travelHeading = Math.atan2(slopeY, slopeX);
    bird.vx = Math.cos(travelHeading) * speed;
    bird.vy = Math.sin(travelHeading) * speed;

    const flare = smoothstep(0.74, 1, next);
    const noseUp = Math.atan2(-1, 0.45 * bird.facing);
    bird.heading = lerpAngle(travelHeading, noseUp, flare * 0.75);
    bird.stretch = 1 - flare * 0.32;

    if (next < 1) return;
    bird.state = "settling";
    bird.settleAge = 0;
    bird.settleFrom = bird.heading;
}

const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

/** Folds from the flare onto the branch with a small overshoot and a dip of the bough. */
export function settle(bird: Bird, dt: number) {
    bird.settleAge += dt;
    const progress = Math.min(1, bird.settleAge / SETTLE_SECONDS);
    const restHeading = restingSpot(bird.perch!, bird.facing, target);
    bird.heading = lerpAngle(bird.settleFrom, restHeading, easeOutBack(progress));
    bird.stretch = lerp(0.68, 1, smoothstep(0, 0.7, progress));
    bird.x = target.x;
    bird.y = target.y + Math.sin(progress * Math.PI) * 2.4;
    if (progress < 1) return;
    bird.state = "perched";
    bird.idle.lean = 0;
    bird.idle.leanTarget = 0;
}
