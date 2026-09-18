
const TAU = Math.PI * 2;
const hash = (i: number, j: number) => {
    const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return x - Math.floor(x);
};
const shimmer = (x: number, y: number, t: number) =>
    (Math.sin(x * 0.015 + y * 0.01 + t * 0.5) + Math.sin((x - y) * 0.012 - t * 0.4)) * 0.25 + 0.5;
const facet = (i: number, j: number): [number, number] => {
    const a = hash(i, j) * TAU;
    return [Math.cos(a), Math.sin(a)];
};
const specular = (cx: number, cy: number, nx: number, ny: number, lx: number, ly: number) => {
    const dx = lx - cx, dy = ly - cy;
    const d = Math.hypot(dx, dy) || 1;
    const align = Math.max(0, (nx * dx + ny * dy) / d);
    return align ** 5 * (0.5 + 0.5 * Math.exp(-d / 380));
};
const triPath = (ctx: CanvasRenderingContext2D, p: number[], cx: number, cy: number, scale: number, ang: number) => {
    const cos = Math.cos(ang), sin = Math.sin(ang);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
        const dx = (p[k * 2] - cx) * scale, dy = (p[k * 2 + 1] - cy) * scale;
        ctx[k === 0 ? "moveTo" : "lineTo"](cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
    }
    ctx.closePath();
};

export type SpinColors = { ink: string; glow: string; red: string };
export type Mask = (cx: number, cy: number, w: number, h: number) => number;
export type SpinRect = { x: number; y: number; w: number; h: number };

export type SpinFrame = {
    w: number;
    h: number;
    t: number;
    light: { x: number; y: number };
    colors: SpinColors;
    mask: Mask;
    cell: number;
    intensity: number;
    background?: string;
    brightness?: Mask;
    rect?: SpinRect;
};

const cellTriangles = (i: number, j: number, cell: number) => {
    const x0 = i * cell, y0 = j * cell;
    return ((i + j) & 1) === 0
        ? [[x0, y0, x0 + cell, y0, x0 + cell, y0 + cell], [x0, y0, x0 + cell, y0 + cell, x0, y0 + cell]]
        : [[x0, y0, x0 + cell, y0, x0, y0 + cell], [x0 + cell, y0, x0 + cell, y0 + cell, x0, y0 + cell]];
};

const facetColor = (c: SpinColors, spec: number, sparkle: number) =>
    spec > 0.6 && sparkle > 0.9 ? c.red : spec > 0.42 ? c.glow : c.ink;

const paintFacet = (ctx: CanvasRenderingContext2D, f: SpinFrame, i: number, j: number, ti: number, p: number[]) => {
    const cx = (p[0] + p[2] + p[4]) / 3, cy = (p[1] + p[3] + p[5]) / 3;
    const density = f.mask(cx, cy, f.w, f.h);
    if (density < 0.02 || hash(i * 2 + ti, j) > density) return;
    const [nx, ny] = facet(i * 2 + ti, j);
    const spec = specular(cx, cy, nx, ny, f.light.x, f.light.y);
    const color = facetColor(f.colors, spec, hash(i * 3 + ti, j));
    const glint = shimmer(cx, cy, f.t) * 0.03;
    const burn = f.brightness ? f.brightness(cx, cy, f.w, f.h) : 1;
    if (hash(i * 5 + ti, j) > 0.4) { // ~60% solid, 40% wireframe
        ctx.globalAlpha = Math.min(0.85, (0.045 + spec * 0.85 + glint) * f.intensity * burn);
        ctx.fillStyle = color;
        triPath(ctx, p, cx, cy, 0.9, Math.sin(f.t * 0.5 + hash(i, j) * 6) * 0.05);
        ctx.fill();
        return;
    }
    ctx.globalAlpha = Math.min(0.8, (0.04 + spec * 0.7 + glint) * f.intensity * burn);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.85 + spec * 0.9;
    triPath(ctx, p, cx, cy, 0.82, 0);
    ctx.stroke();
};

const EDGE_BLEED = 2;

const clearArea = (ctx: CanvasRenderingContext2D, area: SpinRect, background?: string) => {
    const x = area.x - EDGE_BLEED, y = area.y - EDGE_BLEED;
    const w = area.w + EDGE_BLEED * 2, h = area.h + EDGE_BLEED * 2;
    if (!background) { ctx.clearRect(x, y, w, h); return; }
    ctx.fillStyle = background;
    ctx.fillRect(x, y, w, h);
};

export const drawSpinFacets = (ctx: CanvasRenderingContext2D, f: SpinFrame) => {
    const cell = f.cell;
    const area = f.rect ?? { x: 0, y: 0, w: f.w, h: f.h };
    const firstColumn = Math.floor(area.x / cell), lastColumn = Math.ceil((area.x + area.w) / cell);
    const firstRow = Math.floor(area.y / cell), lastRow = Math.ceil((area.y + area.h) / cell);
    clearArea(ctx, {
        x: firstColumn * cell,
        y: firstRow * cell,
        w: (lastColumn - firstColumn) * cell,
        h: (lastRow - firstRow) * cell,
    }, f.background);
    ctx.lineJoin = "round";
    for (let j = firstRow; j < lastRow; j++) {
        for (let i = firstColumn; i < lastColumn; i++) {
            const tris = cellTriangles(i, j, cell);
            paintFacet(ctx, f, i, j, 0, tris[0]);
            paintFacet(ctx, f, i, j, 1, tris[1]);
        }
    }
    ctx.globalAlpha = 1;
};

export const MOVING_GAP_MS = 32;
export const RESTING_GAP_MS = 82;

const driftingLight = (anchor: { x: number; y: number; t: number }, t: number, w: number, h: number) => {
    const dt = t - anchor.t;
    return {
        x: anchor.x + Math.sin(dt * 0.25) * w * 0.16 + Math.sin(dt * 0.4) * w * 0.06,
        y: anchor.y + Math.sin(dt * 0.19) * h * 0.16 + Math.sin(dt * 0.33) * h * 0.06,
    };
};

export type SpinColorOptions = {
    theme?: "light" | "dark";
    primary?: string;
};

export function watchSpinColors(opts: SpinColorOptions = {}) {
    const colors: SpinColors = { ink: "#6f6f6f", glow: "#39342e", red: "#c8483c" };
    const read = () => {
        const dark = opts.theme
            ? opts.theme === "dark"
            : document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
        colors.ink = dark
            ? (opts.theme ? "#c9c6c0" : getComputedStyle(document.body).color || "#d0d0d0")
            : "#6f6f6f";
        colors.glow = dark ? "#f4efe6" : "#39342e";
        colors.red = opts.primary || getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#c8483c";
    };
    read();
    const watcher = new MutationObserver(read);
    watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    watcher.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return { colors, stop: () => watcher.disconnect() };
}

export function createSpinDrive(
    canvas: HTMLCanvasElement,
    mask: Mask,
    opts: {
        cell?: number;
        size?: { w: number; h: number };
        background?: string;
        onFrame?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
        theme?: "light" | "dark";
        primary?: string;
        intensity?: number;
        animate?: boolean;
        staticLight?: { x: number; y: number };
    } = {},
): () => void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => { };
    const cell = opts.cell ?? 16;
    const intensity = opts.intensity ?? 1;
    const frame = (t: number, lx: number, ly: number) => {
        drawSpinFacets(ctx, { w, h, t, light: { x: lx, y: ly }, colors, mask, cell, intensity, background: opts.background });
        opts.onFrame?.(ctx, w, h, t);
    };

    const { colors, stop: stopColors } = watchSpinColors(opts);

    let w = 0, h = 0;
    const resize = () => {
        if (opts.size) {
            w = opts.size.w; h = opts.size.h;
            canvas.width = w; canvas.height = h;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const light = opts.staticLight ?? { x: 0.3, y: 0.3 };
    const still = opts.animate === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(() => { resize(); if (still) frame(0, w * light.x, h * light.y); });
    ro.observe(canvas);
    if (still) {
        frame(0, w * light.x, h * light.y);
        return () => { stopColors(); ro.disconnect(); };
    }

    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) * (w / r.width);
        mouse.y = (e.clientY - r.top) * (h / r.height);
        mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    let raf = 0, t0: number | null = null, lx = -1, ly = -1, lastDraw = -1e9;
    let anchor: { x: number; y: number; t: number } | null = null, wasActive = false;
    const targetLight = (t: number) => {
        if (mouse.active) { wasActive = true; anchor = null; return mouse; }
        if (wasActive || !anchor) { anchor = { x: lx < 0 ? w * 0.5 : lx, y: ly < 0 ? h * 0.4 : ly, t }; wasActive = false; }
        return driftingLight(anchor, t, w, h);
    };
    const loop = (ts: number) => {
        raf = requestAnimationFrame(loop);
        if (t0 === null) t0 = ts;
        const t = (ts - t0) / 1000;
        const target = targetLight(t);
        if (lx < 0) { lx = target.x; ly = target.y; }
        lx += (target.x - lx) * 0.25; ly += (target.y - ly) * 0.25;
        const minGap = mouse.active ? MOVING_GAP_MS : RESTING_GAP_MS;
        if (visible && ts - lastDraw >= minGap) { lastDraw = ts; frame(t, lx, ly); }
    };
    raf = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(raf);
        stopColors(); ro.disconnect(); io.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
    };
}

export { canopyMask, dividerMask, hashSeed } from "./masks";
export { createWakeTrail, type WakeTrail } from "./wake";
