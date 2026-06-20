"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { buildStairMesh, type StairSpec, type Vec3 } from "../lib/stairs";

// A spinnable wireframe of one staircase, drawn on a plain 2D canvas — no WebGL,
// no 3D library. We build the mesh once, then each frame rotate every point by
// the current yaw/pitch, project it through a simple pinhole camera, and stroke
// the edges back-to-front with depth-faded opacity. Drag to orbit, scroll to
// zoom; it idles with a slow auto-spin until you grab it.

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

export function StairWireframe({ spec, label }: { spec: StairSpec; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mesh = useMemo(() => buildStairMesh(spec), [spec]);

  // camera state lives in refs so the animation loop never restarts on a tilt
  const yaw = useRef(-0.7);
  const pitch = useRef(0.42);
  const dist = useRef(3.1);
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
      if (spinning.current && !drag.current) yaw.current += 0.0045;

      ctx.clearRect(0, 0, w, h);
      const cy = Math.cos(yaw.current);
      const sy = Math.sin(yaw.current);
      const cp = Math.cos(pitch.current);
      const sp = Math.sin(pitch.current);
      const focal = Math.min(w, h) * 0.92;
      const camZ = dist.current * radius;
      const cx2 = w / 2;
      const cy2 = h / 2 + h * 0.06; // nudge down so the flight sits nicely

      for (let i = 0; i < points.length; i++) {
        const p = points[i] as Vec3;
        let x = p[0] - center[0];
        let y = p[1] - center[1];
        let z = p[2] - center[2];
        // yaw about up axis, then pitch about side axis
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y1 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        x = x1;
        y = y1;
        z = z2;
        const depth = camZ - z;
        const s = focal / Math.max(0.001, depth);
        projected[i] = { x: cx2 + x * s, y: cy2 - y * s, depth };
      }

      // far edges first so near ones overlay
      const order = edges
        .map((e, i) => ({ i, d: projected[e.a].depth + projected[e.b].depth }))
        .sort((m, n) => n.d - m.d);

      const dNear = camZ - radius;
      const dFar = camZ + radius;
      for (const { i } of order) {
        const e = edges[i];
        const pa = projected[e.a];
        const pb = projected[e.b];
        const mid = (pa.depth + pb.depth) / 2;
        const t = Math.max(0, Math.min(1, (mid - dNear) / (dFar - dNear || 1)));
        const nose = e.kind === "nose";
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
    yaw.current += dx * 0.01;
    pitch.current = Math.max(-1.2, Math.min(1.3, pitch.current + dy * 0.01));
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
