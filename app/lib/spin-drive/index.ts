// dynamic texture inspired by Project Hail Mary's spin drivea animations, iterated on heavily using opus 4.8 and sol 5.6.
// awesome what you can do with prompting I guess

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

// The spin-drive texture is one fixed, axis-aligned lattice — never rotated, scaled, or warped.
// Variants only change the `mask` (where the texture is allowed to appear).
const drawMixed = (
    ctx: CanvasRenderingContext2D, w: number, h: number, t: number, lx: number, ly: number, c: SpinColors, mask: Mask, cell: number, intensity: number, background?: string,
) => {
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = "round";
    for (let j = 0; j * cell < h; j++) {
        for (let i = 0; i * cell < w; i++) {
            const x0 = i * cell, y0 = j * cell;
            const diag = ((i + j) & 1) === 0;
            const tris = diag
                ? [[x0, y0, x0 + cell, y0, x0 + cell, y0 + cell], [x0, y0, x0 + cell, y0 + cell, x0, y0 + cell]]
                : [[x0, y0, x0 + cell, y0, x0, y0 + cell], [x0 + cell, y0, x0 + cell, y0 + cell, x0, y0 + cell]];
            for (let ti = 0; ti < 2; ti++) {
                const p = tris[ti];
                const cx = (p[0] + p[2] + p[4]) / 3, cy = (p[1] + p[3] + p[5]) / 3;
                const density = mask(cx, cy, w, h);
                if (density < 0.02 || hash(i * 2 + ti, j) > density) continue;
                const [nx, ny] = facet(i * 2 + ti, j);
                const spec = specular(cx, cy, nx, ny, lx, ly);
                const color = spec > 0.6 && hash(i * 3 + ti, j) > 0.9 ? c.red : spec > 0.42 ? c.glow : c.ink;
                if (hash(i * 5 + ti, j) > 0.4) { // ~60% solid, 40% wireframe
                    ctx.globalAlpha = Math.min(0.85, (0.045 + spec * 0.85 + shimmer(cx, cy, t) * 0.03) * intensity);
                    ctx.fillStyle = color;
                    triPath(ctx, p, cx, cy, 0.9, Math.sin(t * 0.5 + hash(i, j) * 6) * 0.05);
                    ctx.fill();
                } else {
                    ctx.globalAlpha = Math.min(0.8, (0.04 + spec * 0.7 + shimmer(cx, cy, t) * 0.03) * intensity);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 0.85 + spec * 0.9;
                    triPath(ctx, p, cx, cy, 0.82, 0);
                    ctx.stroke();
                }
            }
        }
    }
    ctx.globalAlpha = 1;
};

// Mount an animated spin-drive on a canvas. Light follows the cursor (eased, no jump) and drifts
// gently at rest; honours prefers-reduced-motion with a single static frame. Returns a cleanup fn.
export function createSpinDrive(
    canvas: HTMLCanvasElement,
    mask: Mask,
    opts: {
        cell?: number;
        // Fixed backing resolution (e.g. an export size). Without it the canvas tracks its display box.
        size?: { w: number; h: number };
        // Opaque base fill instead of a transparent clear — needed when the frame is exported.
        background?: string;
        // Draw over the texture each frame (e.g. title/description), so overlays end up in the canvas
        // itself and are captured by toBlob / captureStream, not just shown via a DOM layer.
        onFrame?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
        // Force the chip palette to a theme instead of reading the page's dark class.
        theme?: "light" | "dark";
        // Override the accent red instead of reading --primary off the page (which tracks the page theme).
        primary?: string;
        // Scales every facet's alpha. The defaults are tuned for a full-width hero;
        // small panels need a boost or the unlit facets vanish entirely.
        intensity?: number;
        // Draw one frame and stop. Lets a page mount many textures at once and only
        // spend a RAF loop on the one the cursor is actually over.
        animate?: boolean;
        // Where the light sits in the static frame, as a fraction of the canvas box.
        staticLight?: { x: number; y: number };
    } = {},
): () => void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => { };
    const cell = opts.cell ?? 16;
    const intensity = opts.intensity ?? 1;
    const frame = (t: number, lx: number, ly: number) => {
        drawMixed(ctx, w, h, t, lx, ly, colors, mask, cell, intensity, opts.background);
        opts.onFrame?.(ctx, w, h, t);
    };

    const colors: SpinColors = { ink: "#6f6f6f", glow: "#39342e", red: "#c8483c" };
    const readColors = () => {
        const dark = opts.theme
            ? opts.theme === "dark"
            : document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
        colors.ink = dark
            ? (opts.theme ? "#c9c6c0" : getComputedStyle(document.body).color || "#d0d0d0")
            : "#6f6f6f";
        colors.glow = dark ? "#f4efe6" : "#39342e";
        colors.red = opts.primary || getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#c8483c";
    };
    readColors();
    const themeObs = new MutationObserver(readColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

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
        return () => { themeObs.disconnect(); ro.disconnect(); };
    }

    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        // Scale display coords into backing-resolution coords (they differ when `size` is fixed).
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
    const loop = (ts: number) => {
        raf = requestAnimationFrame(loop);
        if (t0 === null) t0 = ts;
        const t = (ts - t0) / 1000;
        let tx: number, ty: number;
        if (mouse.active) {
            tx = mouse.x; ty = mouse.y; wasActive = true; anchor = null;
        } else {
            if (wasActive || !anchor) { anchor = { x: lx < 0 ? w * 0.5 : lx, y: ly < 0 ? h * 0.4 : ly, t }; wasActive = false; }
            const dt = t - anchor.t;
            tx = anchor.x + Math.sin(dt * 0.25) * w * 0.16 + Math.sin(dt * 0.4) * w * 0.06;
            ty = anchor.y + Math.sin(dt * 0.19) * h * 0.16 + Math.sin(dt * 0.33) * h * 0.06;
        }
        if (lx < 0) { lx = tx; ly = ty; }
        lx += (tx - lx) * 0.25; ly += (ty - ly) * 0.25;
        // Frame-rate cap: ~30fps while the light is being steered, ~12fps at rest. A continuous
        // full-canvas redraw at 60fps is what cooks the CPU; the eye can't tell at this cadence.
        const minGap = mouse.active ? 32 : 82;
        if (visible && ts - lastDraw >= minGap) { lastDraw = ts; frame(t, lx, ly); }
    };
    raf = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(raf);
        themeObs.disconnect(); ro.disconnect(); io.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
    };
}

export { canopyMask, dividerMask, hashSeed } from "./masks";
