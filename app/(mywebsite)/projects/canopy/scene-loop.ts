export type Pointer = { x: number; y: number; vx: number; vy: number; active: boolean };

export type SceneSize = { width: number; height: number; dpr: number };

export type SceneHandlers = {
    resize(size: SceneSize): void;
    theme(dark: boolean): void;
    /** Advances the simulation by exactly FIXED_STEP seconds. */
    step(dt: number): void;
    draw(): void;
    /** Draws one composed, motionless frame for people who prefer reduced motion. */
    still(): void;
};

/** Phones run at 3x; capping lower would let the browser blur the dither cells when it scales the canvas up. */
const MAX_DPR = 3;
export const FIXED_STEP = 1 / 120;
/** A long hitch (tab switch, GC, devtools) is simulated as at most this much time. */
const MAX_FRAME_SECONDS = 0.1;
const POINTER_VELOCITY_SMOOTHING = 0.35;

export const isDarkTheme = () => document.documentElement.classList.contains("dark");

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Sizes a canvas to its box at a capped device pixel ratio. */
export function fitCanvas(canvas: HTMLCanvasElement): SceneSize {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(box.width));
    const height = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    return { width, height, dpr };
}

export function trackPointer(canvas: HTMLCanvasElement) {
    const pointer: Pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    let lastMove = 0;
    const place = (event: PointerEvent) => {
        const box = canvas.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        const seconds = Math.max(0.008, (event.timeStamp - lastMove) / 1000);
        if (pointer.active && seconds < 0.2) {
            pointer.vx += ((x - pointer.x) / seconds - pointer.vx) * POINTER_VELOCITY_SMOOTHING;
            pointer.vy += ((y - pointer.y) / seconds - pointer.vy) * POINTER_VELOCITY_SMOOTHING;
        }
        lastMove = event.timeStamp;
        pointer.x = x;
        pointer.y = y;
        pointer.active = y >= 0 && y <= box.height;
    };
    const leave = () => {
        pointer.active = false;
        pointer.vx = pointer.vy = 0;
    };
    window.addEventListener("pointermove", place, { passive: true });
    window.addEventListener("pointerdown", place, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    const dispose = () => {
        window.removeEventListener("pointermove", place);
        window.removeEventListener("pointerdown", place);
        document.documentElement.removeEventListener("pointerleave", leave);
    };
    return { pointer, dispose };
}

/**
 * Turns uneven rAF intervals into whole fixed steps, so a dropped frame or a hitch never
 * changes the size of a physics step.
 */
function createFixedClock(step: (dt: number) => void) {
    let lastTime = 0;
    let owed = 0;
    return {
        reset() {
            lastTime = 0;
            owed = 0;
        },
        advance(now: number) {
            const elapsed = lastTime ? Math.min(MAX_FRAME_SECONDS, (now - lastTime) / 1000) : FIXED_STEP;
            lastTime = now;
            owed += elapsed;
            while (owed >= FIXED_STEP) {
                step(FIXED_STEP);
                owed -= FIXED_STEP;
            }
        },
    };
}

/**
 * Runs a canvas scene: resize, theme changes, rAF that pauses when the tab is hidden or the
 * canvas is offscreen, and a single still frame under reduced motion.
 */
export function runScene(canvas: HTMLCanvasElement, handlers: SceneHandlers) {
    const reduced = prefersReducedMotion();
    const clock = createFixedClock(handlers.step);
    let frameId = 0;
    let onscreen = true;

    const tick = (now: number) => {
        clock.advance(now);
        handlers.draw();
        frameId = requestAnimationFrame(tick);
    };
    const stop = () => {
        cancelAnimationFrame(frameId);
        frameId = 0;
    };
    const start = () => {
        if (reduced || frameId || !onscreen || document.hidden) return;
        clock.reset();
        frameId = requestAnimationFrame(tick);
    };
    const redrawIdle = () => {
        if (reduced) handlers.still();
        else if (!frameId) handlers.draw();
    };

    const resizeObserver = new ResizeObserver(() => {
        handlers.resize(fitCanvas(canvas));
        if (reduced) handlers.still();
        else handlers.draw();
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
        onscreen = entry.isIntersecting;
        if (onscreen) start();
        else stop();
    });
    visibility.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibilityChange);

    const themeObserver = new MutationObserver(() => {
        handlers.theme(isDarkTheme());
        redrawIdle();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    handlers.theme(isDarkTheme());
    start();

    return {
        /** Draws a frame now when the loop is not running to draw one itself. */
        redraw: redrawIdle,
        dispose() {
            stop();
            resizeObserver.disconnect();
            visibility.disconnect();
            themeObserver.disconnect();
            document.removeEventListener("visibilitychange", onVisibilityChange);
        },
    };
}
