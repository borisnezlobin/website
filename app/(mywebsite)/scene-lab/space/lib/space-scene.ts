import { PerspectiveCamera, Scene, Vector2, WebGLRenderer } from "three";
import { FOV } from "./framing";
import type { LookFactory } from "./looks/look";
import { isDarkTheme, watchTheme } from "./palette";
import { createSpaceWorld } from "./space-world";
import { loadWhaleAsset } from "./whale-asset";

export type SpaceSceneOptions = { look: LookFactory; reducedMotion: boolean };
export type SpaceScene = { dispose: () => void };

const MAX_STEP = 1 / 20;
/** Reduced motion gets one composed frame: this far into the swim, with a bolt mid-strike. */
const STILL_TIME = 9.5;
const STILL_ZAP_AGE = 0.05;

function rollingAverage(previous: number, sample: number) {
    return previous === 0 ? sample : previous * 0.95 + sample * 0.05;
}

export function createSpaceScene(canvas: HTMLCanvasElement, { look: makeLook, reducedMotion }: SpaceSceneOptions): SpaceScene {
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.5, 400);
    const look = makeLook({ renderer, scene, camera }, isDarkTheme());
    const world = createSpaceWorld(look, scene, camera);
    const pointer = new Vector2();
    const state = { time: 0, last: 0, frame: 0, running: false, visible: true, onScreen: true, disposed: false, cpuMs: 0 };

    function draw(dt: number) {
        const started = performance.now();
        world.update(dt, state.time, pointer);
        look.render({ time: state.time, dt, glitch: reducedMotion ? 0 : world.director.glitch, glitchSeed: world.director.glitchSeed });
        state.cpuMs = rollingAverage(state.cpuMs, performance.now() - started);
        canvas.dataset.cpuMs = state.cpuMs.toFixed(2);
    }

    function composeStill() {
        world.update(0, STILL_TIME, pointer);
        world.director.trigger();
        world.update(STILL_ZAP_AGE, STILL_TIME, pointer);
        draw(0);
    }

    function tick(now: number) {
        if (!state.running) return;
        const dt = Math.min(MAX_STEP, (now - (state.last || now)) / 1000);
        state.last = now;
        state.time += dt;
        draw(dt);
        state.frame = requestAnimationFrame(tick);
    }

    function syncLoop() {
        const shouldRun = !reducedMotion && state.visible && state.onScreen && !state.disposed;
        if (shouldRun === state.running) return;
        state.running = shouldRun;
        state.last = 0;
        if (shouldRun) state.frame = requestAnimationFrame(tick);
        else cancelAnimationFrame(state.frame);
    }

    function resize() {
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, look.maxPixelRatio);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        look.resize(width, height, pixelRatio);
        world.layout(width / height);
        if (reducedMotion) composeStill();
    }

    const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2);
    };
    const onPointerDown = (event: PointerEvent) => {
        onPointerMove(event);
        const target = world.nearestTo(pointer);
        if (target) world.director.trigger(target);
        if (reducedMotion) draw(0);
    };
    const onVisibility = () => {
        state.visible = document.visibilityState === "visible";
        syncLoop();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
        state.onScreen = entry.isIntersecting;
        syncLoop();
    });
    intersection.observe(canvas);
    const unwatchTheme = watchTheme((dark) => {
        look.setTheme(dark);
        if (reducedMotion) draw(0);
    });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("visibilitychange", onVisibility);

    if (process.env.NODE_ENV !== "production") Object.assign(canvas, { spaceProbe: { whales: world.whaleScreenPositions, zap: () => world.director.zap.core } });
    resize();
    syncLoop();
    loadWhaleAsset()
        .then((asset) => {
            if (state.disposed) return;
            world.addWhales(asset);
            if (reducedMotion) composeStill();
        })
        .catch((error: unknown) => console.error("space scene: whale failed to load", error));

    return {
        dispose: () => {
            state.disposed = true;
            syncLoop();
            resizeObserver.disconnect();
            intersection.disconnect();
            unwatchTheme();
            window.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("visibilitychange", onVisibility);
            world.dispose();
            look.dispose();
            renderer.dispose();
        },
    };
}
