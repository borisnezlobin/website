/** Canvas plumbing shared by every creek direction: sizing, theme, reduced motion and the frame loop. */

export const MAX_DPR = 2;

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type CanvasSize = { width: number; height: number; dpr: number };

export function measureCanvas(canvas: HTMLCanvasElement): CanvasSize {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    return { width: Math.max(1, canvas.clientWidth), height: Math.max(1, canvas.clientHeight), dpr };
}

export function fitCanvas(canvas: HTMLCanvasElement): CanvasSize {
    const size = measureCanvas(canvas);
    canvas.width = Math.round(size.width * size.dpr);
    canvas.height = Math.round(size.height * size.dpr);
    return size;
}

export const isDarkMode = () => document.documentElement.classList.contains("dark");

/** Calls `onChange` whenever next-themes flips the `dark` class on the root element. */
export function watchDarkMode(onChange: (dark: boolean) => void) {
    const observer = new MutationObserver(() => onChange(isDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

/** Calls `onResize` after the canvas changes size, batched to one call per frame. */
export function watchResize(canvas: HTMLCanvasElement, onResize: () => void) {
    let pending = 0;
    let first = true;
    const observer = new ResizeObserver(() => {
        if (first) { first = false; return; }
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(onResize);
    });
    observer.observe(canvas);
    return () => { cancelAnimationFrame(pending); observer.disconnect(); };
}

export type FrameLoop = { dispose: () => void };

/**
 * Runs `tick(seconds, deltaSeconds)` every animation frame while the canvas is on screen and the
 * tab is visible. The delta is clamped so a resumed tab does not make the water jump.
 */
export function createFrameLoop(canvas: HTMLCanvasElement, tick: (time: number, delta: number) => void): FrameLoop {
    let onScreen = true;
    let raf = 0;
    let last = 0;
    let time = 0;
    const running = () => onScreen && document.visibilityState === "visible";
    const frame = (now: number) => {
        raf = 0;
        if (!running()) return;
        const delta = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        time += delta;
        tick(time, delta);
        raf = requestAnimationFrame(frame);
    };
    const resume = () => {
        if (raf || !running()) return;
        last = 0;
        raf = requestAnimationFrame(frame);
    };
    const intersection = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; resume(); });
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    resume();
    return {
        dispose: () => {
            cancelAnimationFrame(raf);
            intersection.disconnect();
            document.removeEventListener("visibilitychange", resume);
        },
    };
}

export type PointerTrail = { x: number; y: number; dx: number; dy: number; pressed: boolean; active: boolean; dispose: () => void };

/** Tracks the pointer over the canvas in CSS pixels, with the movement since the last read. */
export function trackPointer(canvas: HTMLCanvasElement): PointerTrail {
    const trail: PointerTrail = { x: 0, y: 0, dx: 0, dy: 0, pressed: false, active: false, dispose: () => { } };
    const move = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        if (trail.active) { trail.dx += x - trail.x; trail.dy += y - trail.y; }
        trail.x = x; trail.y = y; trail.active = true;
    };
    const down = (event: PointerEvent) => { trail.pressed = true; move(event); };
    const up = () => { trail.pressed = false; };
    const leave = () => { trail.active = false; trail.pressed = false; };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", leave);
    trail.dispose = () => {
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerdown", down);
        window.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointerleave", leave);
    };
    return trail;
}

/** Returns the pointer movement accumulated since the last call and resets it. */
export function takePointerMotion(trail: PointerTrail) {
    const motion = { dx: trail.dx, dy: trail.dy };
    trail.dx = 0; trail.dy = 0;
    return motion;
}
