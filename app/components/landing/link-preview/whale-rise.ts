import type { InkCloud } from "@/app/components/whales/ink/ink-cloud";
import type { BodyFrame } from "@/app/components/whales/ink/ink-body";
import { strokePush, type WhaleBehaviorPath } from "@/app/components/whales/whale-catalog";
import { makeFlukeFinder } from "@/app/components/whales/ink/ink-fluke";

/** The home page's climb: cruise in, pitch up, climb up and to the right like the hero, level off, and cruise out. */
export const RISE_CHAIN = ["cruise_loop", "rise_in", "rise_hold", "rise_out", "cruise_loop"] as const;

export type Clip = { name: string; cloud: InkCloud; bodies: BodyFrame[]; path: WhaleBehaviorPath };

export type RisePose = { clip: Clip; frame: number; originX: number; originY: number; scale: number };

/** The body as a capsule: a spine from one end of the body to the other, and how far the body reaches either side of it. */
export type BodyCapsule = { fromX: number; fromY: number; toX: number; toY: number; radius: number };

export type WhaleRise = {
    poseAt(t: number): RisePose | null;
    capsuleAt(t: number): BodyCapsule | null;
    flukeAt(t: number): { x: number; y: number; push: number } | null;
};

type Placement = { clip: Clip; begins: number; seconds: number; alongBefore: number; heightBefore: number };

/** The spine of one frame of a cloud, from the spread of its points (their principal axis). */
function spine(cloud: InkCloud, frame: number) {
    const base = frame * cloud.count * 2;
    let mx = 0, my = 0;
    for (let i = 0; i < cloud.count; i++) { mx += cloud.points[base + i * 2]; my += cloud.points[base + i * 2 + 1]; }
    mx /= cloud.count; my /= cloud.count;
    let xx = 0, xy = 0, yy = 0;
    for (let i = 0; i < cloud.count; i++) {
        const dx = cloud.points[base + i * 2] - mx, dy = cloud.points[base + i * 2 + 1] - my;
        xx += dx * dx; xy += dx * dy; yy += dy * dy;
    }
    const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
    const ux = Math.cos(angle), uy = Math.sin(angle);
    let low = Infinity, high = -Infinity, across = 0;
    for (let i = 0; i < cloud.count; i++) {
        const dx = cloud.points[base + i * 2] - mx, dy = cloud.points[base + i * 2 + 1] - my;
        const along = dx * ux + dy * uy;
        low = Math.min(low, along); high = Math.max(high, along);
        across += (dx * uy - dy * ux) ** 2;
    }
    const radius = 1.6 * Math.sqrt(across / cloud.count);
    return { mx, my, ux, uy, low: low + radius * 0.5, high: high - radius * 0.5, radius };
}

/** Root motion read between the export's frames, in body lengths. */
function stepAt(path: WhaleBehaviorPath, share: number) {
    const at = share * (path.steps.length - 1);
    const below = Math.floor(at), above = Math.min(path.steps.length - 1, below + 1), mix = at - below;
    return {
        along: path.steps[below][0] + (path.steps[above][0] - path.steps[below][0]) * mix,
        height: path.steps[below][1] + (path.steps[above][1] - path.steps[below][1]) * mix,
    };
}

/**
 * The whale's climb, played on the exported clips' own root motion: every frame moves the body
 * exactly as far as the export says that frame's tail stroke carries it. Playing the clips faster
 * makes the strokes and the travel faster together.
 */
export function riseWhale(clips: Clip[], options: { starts: number; rate: number; bodyPx: number; startX: number; startY: number }): WhaleRise {
    const placements: Placement[] = [];
    let begins = options.starts, along = 0, height = 0;
    for (const clip of clips) {
        const seconds = clip.path.seconds / options.rate;
        placements.push({ clip, begins, seconds, alongBefore: along - clip.path.steps[0][0], heightBefore: height - clip.path.steps[0][1] });
        begins += seconds;
        along += clip.path.cycle[0] - clip.path.steps[0][0];
        height += clip.path.cycle[1] - clip.path.steps[0][1];
    }
    const ends = begins;
    const spines = new Map(clips.map((clip) => [clip, Array.from({ length: clip.cloud.frames }, (_, frame) => spine(clip.cloud, frame))]));
    const flukes = new Map(clips.map((clip) => [clip, makeFlukeFinder(clip.cloud)]));

    const poseAt = (t: number): RisePose | null => {
        if (t < options.starts || t >= ends) return null;
        const placed = placements.find((p) => t < p.begins + p.seconds)!;
        const share = (t - placed.begins) / placed.seconds;
        const step = stepAt(placed.clip.path, share);
        const scale = options.bodyPx / (placed.clip.path.bodyFraction * placed.clip.cloud.size[0]);
        return {
            clip: placed.clip,
            frame: Math.min(placed.clip.cloud.frames - 1, Math.floor(share * placed.clip.cloud.frames)),
            originX: options.startX + (placed.alongBefore + step.along) * options.bodyPx,
            originY: options.startY + (placed.heightBefore + step.height) * options.bodyPx,
            scale,
        };
    };

    const capsuleAt = (t: number): BodyCapsule | null => {
        const pose = poseAt(t);
        if (!pose) return null;
        const s = spines.get(pose.clip)![pose.frame];
        const x = (u: number) => pose.originX + (s.mx + s.ux * u) * pose.scale;
        const y = (u: number) => pose.originY + (s.my + s.uy * u) * pose.scale;
        return { fromX: x(s.low), fromY: y(s.low), toX: x(s.high), toY: y(s.high), radius: s.radius * pose.scale };
    };

    const flukeAt = (t: number) => {
        const pose = poseAt(t);
        if (!pose) return null;
        const fluke = flukes.get(pose.clip)!.at(pose.frame);
        if (!fluke) return null;
        const [width, height] = pose.clip.cloud.size;
        return { x: pose.originX + fluke[0] * width * pose.scale, y: pose.originY + fluke[1] * height * pose.scale, push: strokePush(pose.clip.path, pose.frame) };
    };

    return { poseAt, capsuleAt, flukeAt };
}

export function drawRisingWhale(ctx: CanvasRenderingContext2D, pose: RisePose) {
    const body = pose.clip.bodies[pose.frame];
    if (!body) return;
    const [originX, originY] = pose.clip.cloud.bodyOrigin;
    ctx.drawImage(body.bitmap, pose.originX + (originX + body.x) * pose.scale, pose.originY + (originY + body.y) * pose.scale, body.width * pose.scale, body.height * pose.scale);
}
