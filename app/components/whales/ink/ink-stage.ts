import type { WhaleVisualState } from "../whale-catalog";
import { isDrawnLive, openInkPainter, type InkPainter } from "./ink-painter";

export const CROSSFADE_MS = 620;

const REVEAL_STEPS = 12;

const LONGEST_STEP_MS = 50;

function eased(fraction: number) {
    if (fraction >= 1) return 1;
    if (fraction < 0.5) return 4 * fraction * fraction * fraction;
    return 1 - Math.pow(-2 * fraction + 2, 3) / 2;
}

type Layer = {
    style: string;
    ink: InkPainter | null;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    tick: number;
    rung: number;
};

export type InkStage = {
    show(style: string): void;
    want(behavior: string): void;
    warm(behavior: string): void;
    setActive(active: boolean): void;
    crossing(): boolean;
    showing(): string;
    paint(
        out: CanvasRenderingContext2D,
        behavior: string,
        frame: number,
        state: WhaleVisualState,
        tick: number,
        now: number,
    ): number;
    close(): void;
};

function makeLayer(style: string): Layer {
    const canvas = document.createElement("canvas");
    return {
        style,
        ink: openInkPainter(style, 1, 1),
        canvas,
        context: canvas.getContext("2d")!,
        tick: -1,
        rung: -1,
    };
}

export function makeInkStage(style: string, crossfadeMs = CROSSFADE_MS, entranceMs = 0): InkStage {
    let arriving = makeLayer(style);
    let leaving: Layer | null = null;
    let elapsed = 0;
    let lastAt = 0;
    let entered = entranceMs <= 0;
    let entranceElapsed = 0;
    let entranceAt = 0;
    let active = false;
    let wanted = new Set<string>();
    let lastOut: CanvasRenderingContext2D | null = null;

    const sizeTo = (layer: Layer, w: number, h: number) => {
        if (layer.canvas.width === w && layer.canvas.height === h) return;
        layer.canvas.width = w;
        layer.canvas.height = h;
        layer.tick = -1;
        layer.rung = -1;
    };

    const dropLeaving = () => {
        leaving?.ink?.close();
        leaving = null;
    };

    const holdPicture = (layer: Layer) => {
        if (!lastOut) return;
        sizeTo(layer, lastOut.canvas.width, lastOut.canvas.height);
        layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        layer.context.drawImage(lastOut.canvas, 0, 0);
        layer.ink?.close();
        layer.ink = null;
    };

    const beginArrival = (next: string) => {
        const fresh = makeLayer(next);
        fresh.ink?.setActive(active);
        wanted.forEach((behavior) => fresh.ink?.want(behavior));
        arriving = fresh;
        entered = true;
        elapsed = 0;
        lastAt = performance.now();
    };

    const inkLayer = (
        layer: Layer,
        behavior: string,
        frame: number,
        state: WhaleVisualState,
        tick: number,
        reveal: number,
        rung: number,
    ) => {
        if (!layer.ink) return layer.tick;
        if (layer.tick === tick && layer.rung === rung) return layer.tick;
        const drawn = layer.ink.paint(layer.context, behavior, frame, state, tick, reveal);
        if (drawn < 0) return -1;
        layer.tick = tick;
        layer.rung = rung;
        return drawn;
    };

    // The first drawing a whale ever shows is inked on, the way a style change
    // is, so it arrives instead of appearing between two frames.
    const enter = (
        out: CanvasRenderingContext2D,
        behavior: string,
        frame: number,
        state: WhaleVisualState,
        tick: number,
        now: number,
    ) => {
        entranceElapsed += Math.min(now - (entranceAt || now), LONGEST_STEP_MS);
        entranceAt = now;
        const reveal = eased(Math.min(1, entranceElapsed / entranceMs));
        const drawn = arriving.ink?.paint(out, behavior, frame, state, tick, reveal) ?? -1;
        if (drawn < 0) {
            entranceElapsed = 0;
            return drawn;
        }
        if (reveal >= 1) entered = true;
        return drawn;
    };

    const blend = (out: CanvasRenderingContext2D, fade: number) => {
        const w = out.canvas.width;
        const h = out.canvas.height;
        out.clearRect(0, 0, w, h);
        if (leaving) {
            out.globalAlpha = 1 - fade;
            out.drawImage(leaving.canvas, 0, 0);
        }
        out.globalAlpha = fade;
        out.drawImage(arriving.canvas, 0, 0);
        out.globalAlpha = 1;
    };

    return {
        showing: () => arriving.style,
        crossing: () => leaving !== null || !entered,
        want(behavior) {
            wanted.add(behavior);
            arriving.ink?.want(behavior);
            leaving?.ink?.want(behavior);
        },
        warm(behavior) {
            arriving.ink?.warm(behavior);
        },
        setActive(next) {
            active = next;
            arriving.ink?.setActive(next);
            leaving?.ink?.setActive(next);
        },
        show(next) {
            if (next === arriving.style || !isDrawnLive(next)) return;
            if (crossfadeMs <= 0) {
                dropLeaving();
                arriving.ink?.close();
                beginArrival(next);
                return;
            }
            if (leaving) {
                holdPicture(leaving);
                arriving.ink?.close();
            } else {
                leaving = arriving;
            }
            beginArrival(next);
        },
        paint(out, behavior, frame, state, tick, now) {
            lastOut = out;
            if (!leaving && !entered) return enter(out, behavior, frame, state, tick, now);
            if (!leaving) return arriving.ink?.paint(out, behavior, frame, state, tick) ?? -1;

            const w = out.canvas.width;
            const h = out.canvas.height;
            sizeTo(arriving, w, h);
            sizeTo(leaving, w, h);

            elapsed += Math.min(now - lastAt, LONGEST_STEP_MS);
            lastAt = now;
            const fade = eased(Math.min(1, elapsed / crossfadeMs));
            const rung = Math.round(fade * REVEAL_STEPS);
            const drawn = inkLayer(arriving, behavior, frame, state, tick, rung / REVEAL_STEPS, rung);
            if (drawn < 0) {
                elapsed = 0;
                inkLayer(leaving, behavior, frame, state, tick, 1, REVEAL_STEPS);
                blend(out, 0);
                return leaving.tick;
            }
            inkLayer(leaving, behavior, frame, state, tick, 1, REVEAL_STEPS);
            blend(out, fade);
            if (fade >= 1) dropLeaving();
            return drawn;
        },
        close() {
            dropLeaving();
            arriving.ink?.close();
            arriving.ink = null;
            wanted = new Set();
            lastOut = null;
        },
    };
}
