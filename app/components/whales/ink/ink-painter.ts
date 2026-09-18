import { loadCloud } from "./ink-cloud";
import { makeDrawer } from "./ink-draw";
import { prepareNeighbourhood } from "./ink-neighbours";
import { makeCompositor } from "./ink-effects";
import { atScale, frenzied, INK_STYLES } from "./ink-style";
import type { WhaleVisualState } from "../whale-catalog";
import { bodiesAreSupported, fetchBody, openBody, type BodyReel } from "./ink-body";
import { makeFlukeFinder, type FlukePoint } from "./ink-fluke";

export function isDrawnLive(style: string) {
    if (!(style in INK_STYLES)) return false;
    return !INK_STYLES[style].underlay || bodiesAreSupported();
}

export const NEGATIVE_IN_DARK = "whale-negative";

export function invertsInDark(style: string) {
    return style in INK_STYLES && INK_STYLES[style].negativeInDark === true;
}

export type InkPainter = {
    paint(
        out: CanvasRenderingContext2D,
        behavior: string,
        frame: number,
        state: WhaleVisualState,
        tick?: number,
        reveal?: number,
    ): number;
    ground(): number;
    bodyBox(): [number, number, number, number] | null;
    fluke(): FlukePoint | null;
    waiting(): string;
    want(behavior: string): void;
    warm(behavior: string): void;
    setActive(active: boolean): void;
    close(): void;
};

type Clip = {
    drawer: ReturnType<typeof makeDrawer>;
    fluke: ReturnType<typeof makeFlukeFinder>;
    size: [number, number];
    bodyOrigin: [number, number];
    body: BodyReel | null;
    frames: number;
};

export function openInkPainter(styleName: string, width: number, height: number): InkPainter {
    const calm = INK_STYLES[styleName];
    const hover = frenzied(calm);
    const clips = new Map<string, Clip>();
    const arriving = new Set<string>();
    let closed = false;
    let active = false;

    let strokes: HTMLCanvasElement | null = null;
    let strokeContext: CanvasRenderingContext2D | null = null;
    let composeCalm: ReturnType<typeof makeCompositor> | null = null;
    let composeHover: ReturnType<typeof makeCompositor> | null = null;
    let built = "";
    let lastGround = -1;
    let lastWaiting = "";
    let lastBodyBox: [number, number, number, number] | null = null;
    let lastFluke: FlukePoint | null = null;

    const build = (w: number, h: number) => {
        const key = `${w}x${h}`;
        if (built === key) return;
        strokes = document.createElement("canvas");
        strokes.width = w;
        strokes.height = h;
        strokeContext = strokes.getContext("2d");
        composeCalm = null;
        composeHover = null;
        built = key;
    };
    build(width, height);

    const releaseSurfaces = () => {
        strokes = null;
        strokeContext = null;
        composeCalm = null;
        composeHover = null;
        built = "";
    };

    const want = (behavior: string) => {
        if (closed || clips.has(behavior) || arriving.has(behavior)) return;
        arriving.add(behavior);
        if (calm.underlay) fetchBody(behavior);
        loadCloud(behavior)
            .then((cloud) => {
                arriving.delete(behavior);
                if (closed) return;
                prepareNeighbourhood(cloud);
                clips.set(behavior, {
                    drawer: makeDrawer(cloud),
                    fluke: makeFlukeFinder(cloud),
                    size: cloud.size,
                    bodyOrigin: cloud.bodyOrigin,
                    frames: cloud.frames,
                    body: null,
                });
            })
            .catch(() => arriving.delete(behavior));
    };

    const bodyOf = (behavior: string, clip: Clip) => {
        clip.body ??= openBody(behavior);
        return clip.body;
    };

    const closeBodies = () => {
        clips.forEach((clip) => {
            clip.body?.close();
            clip.body = null;
        });
    };

    return {
        want,
        warm(behavior) {
            if (closed || !active || !calm.underlay) return;
            const clip = clips.get(behavior);
            if (clip) bodyOf(behavior, clip).warm();
            else want(behavior);
        },
        setActive(nextActive) {
            if (active === nextActive) return;
            active = nextActive;
            if (!active) {
                closeBodies();
                releaseSurfaces();
            }
        },
        ground: () => lastGround,
        bodyBox: () => lastBodyBox,
        fluke: () => lastFluke,
        waiting: () => lastWaiting,
        paint(out, behavior, frame, state, tick = frame, reveal = 1) {
            if (!active) {
                lastWaiting = "inactive";
                return -1;
            }
            const clip = clips.get(behavior);
            if (!clip) {
                want(behavior);
                lastWaiting = arriving.has(behavior) ? "cloud loading" : "cloud missing";
                return -1;
            }
            const w = out.canvas.width;
            const h = out.canvas.height;
            const scale = w / clip.size[0];
            build(w, h);
            if (!strokes || !strokeContext) return -1;

            const style = state === "calm" ? calm : hover;
            if (state === "calm") composeCalm ??= makeCompositor(w, h, atScale(calm, scale));
            else composeHover ??= makeCompositor(w, h, atScale(hover, scale));
            const compose = state === "calm" ? composeCalm : composeHover;

            let ground: ImageBitmap | null = null;
            let groundAlpha = 1;
            let where: [number, number, number, number] = [0, 0, 0, 0];
            let on = frame;
            if (calm.underlay) {
                const body = bodyOf(behavior, clip);
                body.show(frame);
                const held = body.at();
                lastGround = body.showing();
                if (!held || lastGround < 0) {
                    lastWaiting = `body ${body.status()}`;
                    return -1;
                }
                on = lastGround;
                ground = held.bitmap;
                groundAlpha = reveal;
                where = [
                    (clip.bodyOrigin[0] + held.x) * scale,
                    (clip.bodyOrigin[1] + held.y) * scale,
                    held.width * scale,
                    held.height * scale,
                ];
                lastBodyBox = [where[0] / w, where[1] / h, where[2] / w, where[3] / h];
            }
            lastWaiting = "";
            lastFluke = clip.fluke.at(on);

            strokeContext.clearRect(0, 0, w, h);
            if (!clip.drawer.strokes(strokeContext, on, scale, style, tick, reveal)) {
                lastWaiting = "ink neighbours";
                return -1;
            }
            if (groundAlpha < 1 && ground) {
                strokeContext.save();
                strokeContext.globalAlpha = groundAlpha;
                strokeContext.globalCompositeOperation = "destination-over";
                strokeContext.drawImage(ground, where[0], where[1], where[2], where[3]);
                strokeContext.restore();
                ground = null;
            }
            compose?.(out, strokes, ground, where, clip.drawer.random);
            return on;
        },
        close() {
            closed = true;
            closeBodies();
            releaseSurfaces();
            clips.clear();
        },
    };
}
