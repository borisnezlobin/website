"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import type { StairMesh, Vec3 } from "../lib/stairs";

// A spinnable wireframe of one staircase, drawn on a plain 2D canvas — no WebGL,
// no 3D library. Each frame we run every point through a look-at orbit camera
// (world axes: +X right, +Y up, +Z away from the viewer) and stroke the edges
// back-to-front with depth-faded opacity. Drag to orbit, scroll to zoom; it
// idles with a slow auto-spin until you grab it.

interface Colors {
  nose: string;
  tread: string;
  riser: string;
  rung: string;
}

function readColors(el: HTMLElement): Colors {
  const cs = getComputedStyle(el);
  const primary = cs.getPropertyValue("--primary").trim() || "#c2410c";
  const fg = cs.getPropertyValue("color").trim() || "#444";
  return { nose: primary, tread: fg, riser: fg, rung: fg };
}

function rgbaWithAlpha(color: string, alpha: number): string {
  // color comes from getComputedStyle as rgb(...)/rgba(...) or a hex string.
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((s) => parseFloat(s));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const hex = color.replace("#", "");
  if (hex.length === 3 || hex.length === 6) {
    const n = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export function StairWireframe({ mesh, label }: { mesh: StairMesh; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // camera state lives in refs so the animation loop never restarts on a tilt.
  // az/el are orbit angles around the model; default is a gentle front view.
  const az = useRef(-0.35);
  const el = useRef(0.18);
  const dist = useRef(3.0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const spinning = useRef(true);
  const [autoSpin, setAutoSpin] = useState(true);

  useEffect(() => {
    spinning.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) spinning.current = false;

    let colors = readColors(wrap);
    const themeObserver = new MutationObserver(() => (colors = readColors(wrap)));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let raf = 0;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const { points, edges, center, radius } = mesh;
    const projected = new Array(points.length) as { x: number; y: number; depth: number }[];

    const draw = () => {
      if (spinning.current && !drag.current) az.current += 0.004;

      ctx.clearRect(0, 0, w, h);
      // orbit camera: place it on a sphere around the model and look inward.
      const ce = Math.cos(el.current);
      const se = Math.sin(el.current);
      const ca = Math.cos(az.current);
      const sa = Math.sin(az.current);
      const dir = [sa * ce, se, -ca * ce]; // unit vector from model -> camera
      const D = dist.current * radius;
      const camPos = [center[0] + dir[0] * D, center[1] + dir[1] * D, center[2] + dir[2] * D];
      const fwd = [-dir[0], -dir[1], -dir[2]]; // look direction (+Z into the scene)
      let rt = [fwd[2], 0, -fwd[0]]; // right = normalize(worldUp × fwd), stays level
      const rl = Math.hypot(rt[0], rt[1], rt[2]) || 1;
      rt = [rt[0] / rl, rt[1] / rl, rt[2] / rl];
      const up = [
        fwd[1] * rt[2] - fwd[2] * rt[1],
        fwd[2] * rt[0] - fwd[0] * rt[2],
        fwd[0] * rt[1] - fwd[1] * rt[0],
      ];
      const focal = Math.min(w, h) * 0.92;
      const cx2 = w / 2;
      const cy2 = h / 2 + h * 0.04;

      for (let i = 0; i < points.length; i++) {
        const p = points[i] as Vec3;
        const vx = p[0] - camPos[0];
        const vy = p[1] - camPos[1];
        const vz = p[2] - camPos[2];
        const xv = vx * rt[0] + vy * rt[1] + vz * rt[2];
        const yv = vx * up[0] + vy * up[1] + vz * up[2];
        const zv = vx * fwd[0] + vy * fwd[1] + vz * fwd[2]; // depth in front of camera
        const s = focal / Math.max(0.001, zv);
        projected[i] = { x: cx2 + xv * s, y: cy2 - yv * s, depth: zv };
      }

      // far edges first so near ones overlay
      const order = edges
        .map((e, i) => ({ i, d: projected[e.a].depth + projected[e.b].depth }))
        .sort((m, n) => n.d - m.d);

      const dNear = D - radius;
      const dFar = D + radius;
      for (const { i } of order) {
        const e = edges[i];
        const pa = projected[e.a];
        const pb = projected[e.b];
        const mid = (pa.depth + pb.depth) / 2;
        const t = Math.max(0, Math.min(1, (mid - dNear) / (dFar - dNear || 1)));
        const nose = e.kind === "nose" || e.kind === "edge";
        const base = nose ? colors.nose : colors.tread;
        const alpha = (nose ? 0.95 : 0.5) * (1 - 0.62 * t); // fade with distance
        ctx.strokeStyle = rgbaWithAlpha(base, alpha);
        ctx.lineWidth = nose ? 1.7 : 1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [mesh]);

  // ---- interaction ----------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    az.current -= dx * 0.01; // drag right → orbit right; drag up → look from above
    el.current = Math.max(-1.4, Math.min(1.4, el.current - dy * 0.01));
  };
  const endDrag = () => (drag.current = null);
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    dist.current = Math.max(1.6, Math.min(6, dist.current * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
  };

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-lg bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
      role="img"
      aria-label={label ? `Rotatable 3D wireframe of ${label}` : "Rotatable 3D wireframe of a staircase"}
    >
      <canvas ref={canvasRef} className="block h-full w-full cursor-grab active:cursor-grabbing" />
      <button
        type="button"
        onClick={() => setAutoSpin((s) => !s)}
        aria-label={autoSpin ? "Stop auto-spin" : "Auto-spin"}
        title={autoSpin ? "Stop auto-spin" : "Auto-spin"}
        className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-light-background/80 backdrop-blur transition-colors hover:text-light-foreground dark:border-neutral-700 dark:bg-dark-background/70 dark:hover:text-dark-foreground ${
          autoSpin ? "text-light-foreground dark:text-dark-foreground" : "text-muted dark:text-muted-dark"
        }`}
    >
        <ArrowsClockwise size={15} weight={autoSpin ? "bold" : "regular"} />
      </button>
      <span className="pointer-events-none absolute bottom-2 left-2.5 text-xs text-muted dark:text-muted-dark">
        drag to spin · scroll to zoom
      </span>
    </div>
  );
}
