import { banksAt } from "../creek-layout";
import type { FloatingLayer } from "../floating-layer";
import type { FlowProbe } from "../flow-probe";
import { restingPlaces, shoreLayout } from "./bank-rest";
import { createPrintBody, printRadius, separatePrints, stepPrintBody, type PrintBody } from "./print-body";
import { printSize, restingLongSide, streamShape, type StreamShape } from "./print-sizes";
import { applyPrintPose, type PrintElements } from "./print-pose";

/**
 * The gallery as a stream: a few prints float down the creek at a time, carried by the scene's
 * water, and each one that leaves the bottom waits its turn to come back in at the top. The rest
 * are parked above the top edge, still in the DOM and still focusable; focusing one launches it
 * straight into view. Under reduced motion the prints rest along the banks instead.
 */
export type GalleryPrint = { elements: PrintElements; mediaWidth: number; mediaHeight: number };

export type PrintStream = {
    layer: FloatingLayer;
    setHeld: (index: number, held: boolean) => void;
    /** Brings a print into view (if it is parked or drifting off screen) before focus scrolls to it. */
    bringIntoView: (index: number) => void;
    dispose: () => void;
};

type StreamState = {
    bodies: PrintBody[];
    queue: number[];
    probe: FlowProbe | null;
    shape: StreamShape;
    width: number;
    height: number;
    releaseIn: number;
    time: number;
};

const hash = (n: number) => {
    const x = Math.sin(n * 78.233 + 1.7) * 43758.5453;
    return x - Math.floor(x);
};

function park(body: PrintBody, state: StreamState) {
    body.active = false;
    body.x = state.width / 2;
    body.y = -state.shape.longSide * 2;
    body.vx = 0; body.vy = 0; body.spin = 0;
}

function waterXAt(state: StreamState, y: number, margin: number, pick: number) {
    const { left, right } = banksAt(Math.min(1, Math.max(0, y / state.height)), state.width, state.height);
    const from = left + margin, to = right - margin;
    return to > from ? from + (to - from) * pick : (left + right) / 2;
}

function launch(body: PrintBody, state: StreamState, y: number) {
    body.active = true;
    body.y = y;
    body.x = waterXAt(state, Math.max(0, y), printRadius(body), Math.random());
    body.angle = (Math.random() - 0.5) * 0.8;
    body.spin = 0;
    body.blocked = 0;
    body.riding = 0;
    const flow = { x: 0, y: 0 };
    state.probe?.velocity(body.x, Math.max(2, y), flow);
    body.vx = flow.x * body.lag;
    body.vy = flow.y * body.lag;
}

const clearOfStone = (state: StreamState, body: PrintBody) =>
    !state.probe || state.probe.contact(body.x, body.y, { distance: 0, nx: 0, ny: 0 }).distance > printRadius(body);

const clearOfOthers = (state: StreamState, body: PrintBody) =>
    clearOfStone(state, body) && state.bodies.every((other) => other === body || !other.active || Math.hypot(other.x - body.x, other.y - body.y) > printRadius(body) + printRadius(other));

/** Scatters the first prints over the creek, as if the stream had been carrying them for a while. */
function seed(state: StreamState) {
    state.queue = [];
    const order = state.bodies.map((_, index) => index);
    order.forEach((index, slot) => {
        const body = state.bodies[index];
        park(body, state);
        if (slot >= state.shape.onScreen) { state.queue.push(index); return; }
        for (let attempt = 0; attempt < 30; attempt++) {
            launch(body, state, ((slot + 0.5 + (Math.random() - 0.5) * 0.5) / state.shape.onScreen) * state.height);
            if (clearOfOthers(state, body)) break;
        }
    });
    state.releaseIn = releaseInterval(state);
}

const releaseInterval = (state: StreamState) => Math.min(3.2, Math.max(0.8, state.height / 95 / state.shape.onScreen));

function releaseNext(state: StreamState, dt: number) {
    state.releaseIn -= dt;
    const active = state.bodies.filter((body) => body.active).length;
    if (state.releaseIn > 0 || active >= state.shape.onScreen || state.queue.length === 0) return;
    const body = state.bodies[state.queue[0]];
    launch(body, state, -printRadius(body) - 4);
    if (!clearOfOthers(state, body)) { park(body, state); state.releaseIn = 0.25; return; }
    state.queue.shift();
    state.releaseIn = releaseInterval(state) * (0.8 + Math.random() * 0.5);
}

function retireIfGone(state: StreamState, index: number) {
    const body = state.bodies[index];
    const radius = printRadius(body);
    const gone = body.y - radius > state.height + 8 || body.x + radius < -8 || body.x - radius > state.width + 8;
    if (!gone || body.held) return;
    park(body, state);
    state.queue.push(index);
}

const wakeScratch = { x: 0, y: 0 };

function leaveWake(body: PrintBody, probe: FlowProbe, water: { vx: number; vy: number }) {
    const relX = body.vx - water.vx, relY = body.vy - water.vy;
    const speed = Math.hypot(relX, relY);
    if (speed < 3) return;
    const reach = Math.min(body.width, body.height) * 0.5;
    wakeScratch.x = body.x - (relX / speed) * reach;
    wakeScratch.y = body.y - (relY / speed) * reach;
    probe.wake(wakeScratch.x, wakeScratch.y, relX, relY, reach);
}

function stepStream(state: StreamState, probe: FlowProbe, dt: number) {
    releaseNext(state, dt);
    const { bodies } = state;
    bodies.forEach((body, index) => {
        if (!body.active) return;
        const water = stepPrintBody(body, probe, dt);
        leaveWake(body, probe, water);
        retireIfGone(state, index);
    });
    for (let a = 0; a < bodies.length; a++) {
        if (!bodies[a].active) continue;
        for (let b = a + 1; b < bodies.length; b++) if (bodies[b].active) separatePrints(bodies[a], bodies[b]);
    }
}

function sizeBodies(state: StreamState, prints: GalleryPrint[], longSide: number) {
    prints.forEach((print, index) => {
        const size = printSize(print.mediaWidth, print.mediaHeight, longSide);
        state.bodies[index].width = size.width;
        state.bodies[index].height = size.height;
    });
}

function restAlongBanks(state: StreamState, prints: GalleryPrint[]) {
    const layout = shoreLayout(prints.length, state.width, state.height, restingLongSide(state.width));
    sizeBodies(state, prints, layout.longSide);
    const places = restingPlaces(state.bodies, state.width, state.height, layout);
    state.bodies.forEach((body, index) => {
        Object.assign(body, places[index], { active: true, vx: 0, vy: 0, spin: 0 });
    });
}

export function createPrintStream(stage: HTMLElement, prints: GalleryPrint[], options: { still: boolean }): PrintStream {
    const state: StreamState = {
        bodies: prints.map((_, index) => createPrintBody(100, 100, hash(index))),
        queue: [], probe: null, shape: streamShape(1, 1), width: 1, height: 1, releaseIn: 0, time: 0,
    };
    const render = () => state.bodies.forEach((body, index) => applyPrintPose(prints[index].elements, body, state.time));

    const resize = () => {
        state.width = Math.max(1, stage.clientWidth);
        state.height = Math.max(1, stage.clientHeight);
        state.shape = streamShape(state.width, state.height);
        prints.forEach((print) => { print.elements.root.style.padding = `${state.shape.border}px`; });
        if (options.still) restAlongBanks(state, prints);
        else { sizeBodies(state, prints, state.shape.longSide); state.bodies.forEach((body) => park(body, state)); }
        render();
    };
    resize();
    const observer = new ResizeObserver(() => { resize(); if (state.probe && !options.still) seed(state); });
    observer.observe(stage);

    const layer: FloatingLayer = {
        attach: (probe) => {
            state.probe = probe;
            if (options.still) return;
            seed(state);
            render();
        },
        step: (time, delta) => {
            state.time = time;
            if (options.still || !state.probe) return;
            stepStream(state, state.probe, delta);
            render();
        },
    };

    return {
        layer,
        setHeld: (index, held) => {
            state.bodies[index].held = held;
            if (options.still) render();
        },
        bringIntoView: (index) => {
            const body = state.bodies[index];
            const radius = printRadius(body);
            const visible = body.active && body.y > radius && body.y < state.height - radius;
            if (options.still || visible) return;
            state.queue = state.queue.filter((queued) => queued !== index);
            launch(body, state, Math.max(radius + 8, state.height * 0.28));
            render();
        },
        dispose: () => observer.disconnect(),
    };
}
