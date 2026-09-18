import {
    createWakeTrail,
    drawSpinFacets,
    MOVING_GAP_MS,
    RESTING_GAP_MS,
    watchSpinColors,
    type SpinRect,
} from "@/app/lib/spin-drive";

export type WhaleWake = {
    trace(x: number, y: number, push: number): void;
    close(): void;
};

const WAKE_CELL = 20;
const WAKE_INTENSITY = 1.3;
const FED_RECENTLY_SECONDS = 0.4;
export const WAKE_BLEED_PIXELS = 80;

const stillWake: WhaleWake = { trace: () => { }, close: () => { } };

const spanning = (a: SpinRect, b: SpinRect): SpinRect => {
    const left = Math.min(a.x, b.x), top = Math.min(a.y, b.y);
    return {
        x: left,
        y: top,
        w: Math.max(a.x + a.w, b.x + b.w) - left,
        h: Math.max(a.y + a.h, b.y + b.h) - top,
    };
};

const clampedTo = (rect: SpinRect, w: number, h: number): SpinRect => {
    const left = Math.max(0, rect.x), top = Math.max(0, rect.y);
    const right = Math.min(w, rect.x + rect.w), bottom = Math.min(h, rect.y + rect.h);
    return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
};

export function openWhaleWake(canvas: HTMLCanvasElement): WhaleWake {
    const ctx = canvas.getContext("2d");
    if (!ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return stillWake;

    const trail = createWakeTrail();
    const { colors, stop: stopColors } = watchSpinColors();
    const light = { x: 0, y: 0 };
    let w = 0, h = 0;
    let visible = true;
    let raf = 0, timer = 0;
    let drawn: SpinRect | null = null;
    let lastStroke = -Infinity;

    const wipe = () => {
        if (!drawn) return;
        ctx.clearRect(drawn.x, drawn.y, drawn.w, drawn.h);
        drawn = null;
    };

    const resize = () => {
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.max(1, Math.round(w * ratio));
        canvas.height = Math.max(1, Math.round(h * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawn = null;
    };
    resize();

    const paint = (now: number) => {
        const area = trail.bounds(now);
        if (!area) {
            wipe();
            return false;
        }
        const lit = clampedTo(area, w, h);
        drawSpinFacets(ctx, {
            w, h, t: now, light, colors,
            mask: trail.mask(now),
            brightness: trail.glow(now),
            cell: WAKE_CELL,
            intensity: WAKE_INTENSITY,
            rect: clampedTo(spanning(area, drawn ?? area), w, h),
        });
        drawn = lit;
        return true;
    };

    const step = () => {
        raf = 0;
        if (!visible) {
            wipe();
            return;
        }
        const now = performance.now() / 1000;
        if (!paint(now)) return;
        const gap = now - lastStroke < FED_RECENTLY_SECONDS ? MOVING_GAP_MS : RESTING_GAP_MS;
        timer = window.setTimeout(() => {
            timer = 0;
            raf = requestAnimationFrame(step);
        }, gap);
    };

    const start = () => {
        if (raf || timer || !visible) return;
        raf = requestAnimationFrame(step);
    };

    const stop = () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        raf = 0;
        timer = 0;
    };

    const trace = (x: number, y: number, push: number) => {
        lastStroke = performance.now() / 1000;
        trail.add(x, y, push, lastStroke);
        light.x = x;
        light.y = y;
        start();
    };

    const watcher = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
        else {
            stop();
            wipe();
        }
    }, { rootMargin: "100px" });
    watcher.observe(canvas);

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);

    return {
        trace,
        close: () => {
            stop();
            watcher.disconnect();
            sizes.disconnect();
            stopColors();
        },
    };
}
