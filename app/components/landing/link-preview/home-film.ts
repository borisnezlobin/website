import { loadCloud } from "@/app/components/whales/ink/ink-cloud";
import { loadBodyFrames } from "@/app/components/whales/ink/ink-body";
import { loadCatalog } from "@/app/components/whales/whale-catalog";
import { createWakeTrail, drawSpinFacets, type SpinColors } from "@/app/lib/spin-drive";
import { BIRD_COLORS, BIRD_EDGES, traceBird } from "@/app/(mywebsite)/projects/canopy/boids/draw";
import { createHeadPath, inkWindow, murmurCentre } from "./flight-path";
import { BIRDS, flyFlock, type Flock } from "./flock";
import { traceSignature, type Signature } from "./signature";
import { createSignaturePainter } from "./signature-paint";
import { BEATS, FRAME, clamp01, span } from "./timeline";
import { paintSubtitle } from "./typewriter";
import { drawRisingWhale, riseWhale, RISE_CHAIN, type Clip, type WhaleRise } from "./whale-rise";

const PAGE_BACKGROUND = "#f5f5f5";
const MUTED = "#707070";
const SPIN_COLORS: SpinColors = { ink: "#6f6f6f", glow: "#39342e", red: "#cc2a26" };
/** The hero's lockup: a small "I'm" in Charter beside "Boris." in Vectra, with the subtitle under it. */
const NAME_FONT = "bold 196px vectra";
const GREETING_FONT = "44px charter";
const LOCKUP = { baseline: 500, gap: 26, greetingRise: 34, subtitleY: 588 };
/** The whale is as long as half the card and climbs from off the left edge to off the top right. */
const WHALE = { bodyPx: 600, startX: -980, startY: -40 };
const WAKE_SECONDS = 2.1;

export type HomeCast = { signature: Signature; greeting: { x: number; y: number }; whale: WhaleRise; flock: Flock };

async function loadClips(): Promise<Clip[]> {
    const catalog = await loadCatalog("plain");
    const names = [...new Set(RISE_CHAIN)];
    const loaded = await Promise.all(names.map(async (name) => {
        const [cloud, bodies] = await Promise.all([loadCloud(name), loadBodyFrames(name)]);
        return { name, cloud, bodies, path: catalog.behaviors[name] };
    }));
    return RISE_CHAIN.map((name) => loaded.find((clip) => clip.name === name)!);
}

function layOutLockup() {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = GREETING_FONT;
    const greetingWidth = ctx.measureText("I’m").width;
    ctx.font = NAME_FONT;
    const nameWidth = ctx.measureText("Boris.").width;
    const left = (FRAME.width - greetingWidth - LOCKUP.gap - nameWidth) / 2;
    return { greeting: { x: left, y: LOCKUP.baseline - LOCKUP.greetingRise }, name: { x: left + greetingWidth + LOCKUP.gap, y: LOCKUP.baseline } };
}

export async function castHomeFilm(): Promise<HomeCast> {
    const clips = await loadClips();
    const lockup = layOutLockup();
    const signature = traceSignature("Boris.", NAME_FONT, lockup.name, FRAME);
    const whale = riseWhale(clips, { starts: BEATS.whaleStarts, rate: BEATS.whaleRate, ...WHALE });
    const flock = flyFlock(createHeadPath(signature), murmurCentre, (t) => whale.capsuleAt(t));
    return { signature, greeting: lockup.greeting, whale, flock };
}

/** The whale's wake, as on the home page: spin-drive facets sparkling behind the fluke, pulsing with each stroke. */
function paintWake(ctx: CanvasRenderingContext2D, wakeCanvas: HTMLCanvasElement, whale: WhaleRise, t: number) {
    const trail = createWakeTrail();
    let last: { x: number; y: number } | null = null;
    for (let s = t - WAKE_SECONDS; s <= t; s += 1 / 30) {
        const fluke = whale.flukeAt(s);
        if (!fluke) continue;
        trail.add(fluke.x, fluke.y, fluke.push, s);
        last = fluke;
    }
    const bounds = trail.bounds(t);
    if (!bounds || !last) return;
    const wake = wakeCanvas.getContext("2d")!;
    wake.clearRect(0, 0, FRAME.width, FRAME.height);
    drawSpinFacets(wake, { w: FRAME.width, h: FRAME.height, t, light: last, colors: SPIN_COLORS, mask: trail.mask(t), brightness: trail.glow(t), cell: 20, intensity: 1.3, rect: bounds });
    ctx.drawImage(wakeCanvas, 0, 0);
}

function paintGreeting(ctx: CanvasRenderingContext2D, cast: HomeCast, t: number) {
    const shown = clamp01(span(t, 0, 0.5) - span(t, BEATS.writeOff[0], BEATS.writeOff[0] + 0.5));
    if (shown <= 0) return;
    ctx.globalAlpha = shown;
    ctx.font = GREETING_FONT;
    ctx.fillStyle = MUTED;
    ctx.fillText("I’m", cast.greeting.x, cast.greeting.y);
    ctx.globalAlpha = 1;
}

function paintFlock(ctx: CanvasRenderingContext2D, flock: Flock, t: number) {
    const bird = { x: 0, y: 0, heading: 0, stretch: 1 };
    ctx.beginPath();
    for (let i = 0; i < BIRDS; i++) {
        flock.birdAt(i, t, bird);
        traceBird(ctx, bird);
    }
    ctx.strokeStyle = BIRD_EDGES.light;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = BIRD_COLORS.light;
    ctx.fill();
}

/** Draws second `t` of the loop. */
export function createHomePainter(cast: HomeCast) {
    const wakeCanvas = document.createElement("canvas");
    wakeCanvas.width = FRAME.width;
    wakeCanvas.height = FRAME.height;
    const paintSignature = createSignaturePainter(cast.signature);
    return (ctx: CanvasRenderingContext2D, t: number) => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = PAGE_BACKGROUND;
        ctx.fillRect(0, 0, FRAME.width, FRAME.height);
        paintWake(ctx, wakeCanvas, cast.whale, t);
        const pose = cast.whale.poseAt(t);
        if (pose) drawRisingWhale(ctx, pose);
        const ink = inkWindow(cast.signature, t);
        paintSignature(ctx, ink.from, ink.to, ink.drying);
        paintGreeting(ctx, cast, t);
        paintSubtitle(ctx, t, FRAME.width / 2, LOCKUP.subtitleY);
        paintFlock(ctx, cast.flock, t);
    };
}
