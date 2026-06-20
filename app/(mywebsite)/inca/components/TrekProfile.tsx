"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowsOutSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react/dist/ssr";
import type { TrekData, TrekLandmark } from "../lib/trek";
import { intComma, metres, niceTicks } from "../lib/chart";

// The real trail, explorable. x is true distance (km), y is true elevation (m,
// 30 m topo along a firsthand GPS track). The line is grey where you walk on
// dirt and reddens where Boris counted stone steps — brightest on the steep
// staircases — and zoom in far enough and it resolves into the steps themselves.
// Wheel or buttons to zoom, drag to pan.

const W = 1000;
const PAD = { left: 46, right: 14, top: 24, bottom: 22 };
const MAIN_H = 300;
const MINI_H = 40;
const MINI_GAP = 10;
const H = PAD.top + MAIN_H + MINI_GAP + MINI_H + PAD.bottom;
const TOP = PAD.top;
const BOTTOM = PAD.top + MAIN_H;
const L = PAD.left;
const R = W - PAD.right;
const PW = R - L;
const MINI_TOP = BOTTOM + MINI_GAP;

const MIN_SPAN = 0.35; // closest zoom, km

interface View {
  a: number;
  b: number;
}

export function TrekProfile({ trek }: { trek: TrekData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; a: number; b: number } | null>(null);
  const [view, setView] = useState<View>({ a: 0, b: trek.totalKm });
  const [hoverKm, setHoverKm] = useState<number | null>(null);

  // view-independent: y-bounds, and per-segment step density + direction.
  const base = useMemo(() => {
    const eMin = Math.floor((trek.minElev - 40) / 100) * 100;
    const eMax = Math.ceil((trek.maxElev + 80) / 100) * 100;
    const denom = trek.maxStepsPerKm * 0.55 || 1;
    const segs = trek.profile.slice(0, -1).map((p, i) => {
      const q = trek.profile[i + 1];
      const dkm = q.km - p.km || 1;
      return { density: p.steps / dkm, up: q.elev >= p.elev, steps: p.steps };
    });
    return { eMin, eMax, denom, segs };
  }, [trek]);

  const span = view.b - view.a;
  const sx = (km: number) => L + ((km - view.a) / span) * PW;
  const sy = (e: number) => TOP + (1 - (e - base.eMin) / (base.eMax - base.eMin)) * MAIN_H;
  const kmAtClientX = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return view.a + (((clientX - rect.left) / rect.width) * W - L) * (span / PW);
  };
  const elevAtKm = useMemo(() => {
    const p = trek.profile;
    return (km: number) => {
      if (km <= p[0].km) return p[0].elev;
      if (km >= p[p.length - 1].km) return p[p.length - 1].elev;
      let lo = 0;
      let hi = p.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (p[m].km < km) lo = m;
        else hi = m;
      }
      const t = (km - p[lo].km) / (p[hi].km - p[lo].km || 1);
      return p[lo].elev + t * (p[hi].elev - p[lo].elev);
    };
  }, [trek]);

  const geom = useMemo(() => {
    const p = trek.profile;
    const visIdx: number[] = [];
    for (let i = 0; i < p.length - 1; i++)
      if (p[i + 1].km >= view.a - 0.3 && p[i].km <= view.b + 0.3) visIdx.push(i);

    const first = visIdx[0] ?? 0;
    const lastPt = (visIdx[visIdx.length - 1] ?? 0) + 1;
    const lineKey = (i: number) => `${sx(p[i].km).toFixed(1)},${sy(p[i].elev).toFixed(1)}`;
    const line = "M" + visIdx.map((i) => lineKey(i)).join("L") + "L" + lineKey(lastPt);
    const area =
      `M${sx(p[first].km).toFixed(1)},${BOTTOM}` +
      visIdx.map((i) => `L${lineKey(i)}`).join("") +
      `L${lineKey(lastPt)}L${sx(p[lastPt].km).toFixed(1)},${BOTTOM}Z`;

    // red overlay, one segment per profile piece, opacity by step density
    const reds = visIdx
      .filter((i) => base.segs[i].steps > 0.01)
      .map((i) => ({
        x1: sx(p[i].km),
        y1: sy(p[i].elev),
        x2: sx(p[i + 1].km),
        y2: sy(p[i + 1].elev),
        op: Math.max(0.16, Math.min(1, base.segs[i].density / base.denom)),
      }));

    // individual steps once they're far enough apart to see
    const stepsShown = visIdx.reduce((n, i) => n + base.segs[i].steps, 0);
    const showTicks = PW / Math.max(1, stepsShown) >= 2.4;
    const ticks: { x: number; y: number; up: boolean }[] = [];
    if (showTicks) {
      for (const i of visIdx) {
        const n = Math.round(base.segs[i].steps);
        for (let j = 0; j < n; j++) {
          const km = p[i].km + ((j + 0.5) / n) * (p[i + 1].km - p[i].km);
          if (km < view.a || km > view.b) continue;
          ticks.push({ x: sx(km), y: sy(elevAtKm(km)), up: base.segs[i].up });
        }
      }
    }

    const yTicks = niceTicks(base.eMin, base.eMax, 4).map((v) => ({ v, y: sy(v) }));
    const xStep = niceStepKm(span);
    const xTicks: { v: number; x: number }[] = [];
    for (let v = Math.ceil(view.a / xStep) * xStep; v <= view.b + 1e-6; v += xStep)
      xTicks.push({ v: Math.round(v * 10) / 10, x: sx(v) });

    return { line, area, reds, ticks, showTicks, yTicks, xTicks, lms: placeLandmarks(trek.landmarks, view, sx, sy) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trek, view, base]);

  // ----- interaction --------------------------------------------------------
  const zoomAround = (km: number, factor: number) =>
    setView((v) => {
      const s = Math.max(MIN_SPAN, Math.min(trek.totalKm, (v.b - v.a) * factor));
      const t = (km - v.a) / (v.b - v.a);
      let a = km - t * s;
      let b = a + s;
      if (a < 0) (a = 0), (b = s);
      if (b > trek.totalKm) (b = trek.totalKm), (a = b - s);
      return { a, b };
    });
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomAround(kmAtClientX(e.clientX), e.deltaY > 0 ? 1.18 : 1 / 1.18);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, a: view.a, b: view.b };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const dkm = ((e.clientX - drag.current.x) / rect.width) * W * (span / PW);
      let a = drag.current.a - dkm;
      let b = drag.current.b - dkm;
      if (a < 0) (a = 0), (b = span);
      if (b > trek.totalKm) (b = trek.totalKm), (a = b - span);
      setView({ a, b });
    } else setHoverKm(kmAtClientX(e.clientX));
  };
  const endDrag = () => (drag.current = null);

  const hover = useMemo(() => {
    if (hoverKm == null || hoverKm < view.a || hoverKm > view.b) return null;
    const elev = elevAtKm(hoverKm);
    let near: TrekLandmark | null = null;
    for (const l of trek.landmarks)
      if (!near || Math.abs(l.km - hoverKm) < Math.abs(near.km - hoverKm)) near = l;
    let seg = 0;
    for (let i = 0; i < trek.profile.length - 1; i++)
      if (trek.profile[i].km <= hoverKm && trek.profile[i + 1].km >= hoverKm) seg = i;
    const per100 = Math.round(base.segs[seg]?.density / 10);
    return { km: hoverKm, elev, near, per100, x: sx(hoverKm), y: sy(elev) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverKm, view, trek, base]);

  const zoomed = span < trek.totalKm - 0.01;

  return (
    <figure className="not-prose my-2">
      <div className="relative w-full select-none overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none"
          style={{ minWidth: 600 }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={() => {
            endDrag();
            setHoverKm(null);
          }}
          role="img"
          aria-label={`Elevation profile of the ${Math.round(
            trek.totalKm,
          )} km Inca Trail. It climbs from about ${metres(trek.profile[0].elev)} at Km 82 to ${metres(
            trek.maxElev,
          )} at Dead Woman's Pass, then descends to Machu Picchu. The line reddens over the ${intComma(
            trek.totals.totalStairs,
          )} stone steps counted along the way.`}
        >
          <clipPath id="plot">
            <rect x={L} y={TOP - 4} width={PW} height={MAIN_H + 8} />
          </clipPath>

          {geom.yTicks.map((t) => (
            <g key={t.v}>
              <line x1={L} x2={R} y1={t.y} y2={t.y} className="stroke-neutral-200/70 dark:stroke-neutral-700/40" strokeWidth={1} />
              <text x={L - 7} y={t.y + 3.5} textAnchor="end" className="fill-muted dark:fill-muted-dark tabular-nums" fontSize={11}>
                {intComma(t.v)}
              </text>
            </g>
          ))}
          <text x={L - 7} y={TOP - 10} textAnchor="end" className="fill-muted dark:fill-muted-dark" fontSize={11}>m</text>

          {geom.xTicks.map((t) => (
            <text key={t.v} x={t.x} y={BOTTOM + 15} textAnchor="middle" className="fill-muted dark:fill-muted-dark tabular-nums" fontSize={11}>
              {t.v === geom.xTicks[geom.xTicks.length - 1]?.v ? `${t.v} km` : t.v}
            </text>
          ))}

          <g clipPath="url(#plot)">
            <path d={geom.area} className="fill-neutral-200/60 dark:fill-neutral-800/60" />
            <path d={geom.line} fill="none" className="stroke-neutral-400 dark:stroke-neutral-500" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {/* stairs: line reddens with step density */}
            {geom.reds.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} style={{ stroke: "var(--primary)" }} strokeOpacity={s.op} strokeWidth={2.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ))}
            {geom.showTicks &&
              geom.ticks.map((t, i) => (
                <line key={i} x1={t.x} x2={t.x} y1={t.y} y2={t.up ? t.y - 4 : t.y + 4} style={{ stroke: "var(--primary)" }} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ))}

            {geom.lms.map((l) => (
              <g key={l.name}>
                <circle cx={l.x} cy={l.y} r={l.major ? 3.2 : 2.2} className="fill-light-foreground dark:fill-dark-foreground" stroke="var(--background)" strokeWidth={1.5} />
                {l.labelText && (
                  <>
                    <line x1={l.x} x2={l.x} y1={l.y} y2={l.labelY + (l.above ? 3 : -10)} className="stroke-neutral-300 dark:stroke-neutral-600" strokeWidth={1} />
                    <text x={l.x} y={l.labelY} textAnchor={l.anchor} className="fill-light-foreground dark:fill-dark-foreground" fontSize={l.major ? 12 : 11} fontWeight={l.major ? 600 : 400}>
                      {l.labelText}
                      <tspan className="fill-muted dark:fill-muted-dark" fontWeight={400}>{`  ${intComma(l.elev)} m`}</tspan>
                    </text>
                  </>
                )}
              </g>
            ))}

            {hover && (
              <g>
                <line x1={hover.x} x2={hover.x} y1={TOP} y2={BOTTOM} className="stroke-light-foreground/30 dark:stroke-dark-foreground/30" strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={hover.x} cy={hover.y} r={3.5} style={{ fill: "var(--primary)" }} stroke="var(--background)" strokeWidth={1.5} />
              </g>
            )}
          </g>

          {/* minimap */}
          <path d={miniPath(trek, base)} className="fill-neutral-200/70 dark:fill-neutral-800" />
          <rect
            x={L + (view.a / trek.totalKm) * PW}
            y={MINI_TOP}
            width={Math.max(3, (span / trek.totalKm) * PW)}
            height={MINI_H}
            className="fill-transparent"
            style={{ stroke: "var(--primary)" }}
            strokeWidth={1.5}
            rx={2}
          />
        </svg>

        <div className="absolute right-2.5 top-2.5 flex gap-1">
          <CtrlBtn label="Zoom in" onClick={() => zoomAround((view.a + view.b) / 2, 1 / 1.6)}>
            <MagnifyingGlassPlus size={16} />
          </CtrlBtn>
          <CtrlBtn label="Zoom out" onClick={() => zoomAround((view.a + view.b) / 2, 1.6)}>
            <MagnifyingGlassMinus size={16} />
          </CtrlBtn>
          {zoomed && (
            <CtrlBtn label="Reset" onClick={() => setView({ a: 0, b: trek.totalKm })}>
              <ArrowsOutSimple size={16} />
            </CtrlBtn>
          )}
        </div>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-[230px] -translate-x-1/2 rounded-md border border-neutral-200 bg-light-background/95 px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-dark-background/95"
            style={{ left: `${(hover.x / W) * 100}%`, top: 8 }}
          >
            <div className="font-semibold text-light-foreground dark:text-dark-foreground">
              {metres(hover.elev)}
              <span className="font-normal text-muted dark:text-muted-dark"> · km {hover.km.toFixed(1)}</span>
            </div>
            <div className="mt-0.5 text-muted dark:text-muted-dark">
              {hover.per100 >= 1 ? `≈ ${hover.per100} stone steps per 100 m` : "walking grade — no steps"}
            </div>
            {hover.near && <div className="mt-0.5 text-muted dark:text-muted-dark">near {hover.near.name}</div>}
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted dark:text-muted-dark">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: "var(--primary)" }} /> stone steps
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-neutral-400 dark:bg-neutral-500" /> walking grade
        </span>
        <span className="ml-auto text-muted dark:text-muted-dark">
          {zoomed ? "drag to pan · scroll to zoom" : "scroll or zoom in to find the steps"}
        </span>
      </figcaption>
    </figure>
  );
}

function CtrlBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-light-background/80 text-muted backdrop-blur hover:text-light-foreground dark:border-neutral-700 dark:bg-dark-background/80 dark:text-muted-dark dark:hover:text-dark-foreground"
    >
      {children}
    </button>
  );
}

function niceStepKm(span: number): number {
  const raw = span / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : n >= 1 ? 1 : 0.5) * mag;
}

function miniPath(trek: TrekData, base: { eMin: number; eMax: number }) {
  const sx = (km: number) => L + (km / trek.totalKm) * PW;
  const sy = (e: number) => MINI_TOP + (1 - (e - base.eMin) / (base.eMax - base.eMin)) * MINI_H;
  return (
    `M${L},${MINI_TOP + MINI_H}` +
    trek.profile.map((p) => `L${sx(p.km).toFixed(1)},${sy(p.elev).toFixed(1)}`).join("") +
    `L${R},${MINI_TOP + MINI_H}Z`
  );
}

interface PlacedLandmark {
  name: string;
  x: number;
  y: number;
  elev: number;
  major: boolean;
  labelText: string | null;
  labelY: number;
  above: boolean;
  anchor: "start" | "middle" | "end";
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
const hits = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function placeLandmarks(
  landmarks: TrekLandmark[],
  view: View,
  sx: (k: number) => number,
  sy: (e: number) => number,
): PlacedLandmark[] {
  const inView = landmarks.filter((l) => l.km >= view.a && l.km <= view.b);
  const major = (l: TrekLandmark) =>
    l.kind === "pass" || l.kind === "camp" || l.kind === "start" || l.kind === "end";
  // Place the important markers first, so they win the room.
  const order = [...inView].sort((a, b) => Number(major(b)) - Number(major(a)) || a.km - b.km);
  const taken: Box[] = [];

  const out: PlacedLandmark[] = order.map((l) => {
    const x = sx(l.km);
    const y = sy(l.elev);
    const text = l.name.length > 20 ? l.name.slice(0, 19) + "…" : l.name;
    const width = (text.length + 8) * 5.9; // name + "  N,NNN m"
    const anchor: "start" | "middle" | "end" = x > R - width / 2 ? "end" : x < L + width / 2 ? "start" : "middle";
    const x0 = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
    const box = (ly: number): Box => ({ x0: x0 - 2, x1: x0 + width + 2, y0: ly - 9, y1: ly + 3 });
    // candidate label rows, nearest the point first
    const cands = [
      { ly: Math.max(TOP + 11, y - 13), above: true },
      { ly: Math.min(BOTTOM - 4, y + 18), above: false },
      { ly: Math.max(TOP + 11, y - 28), above: true },
      { ly: Math.min(BOTTOM - 4, y + 33), above: false },
    ];
    const spot = cands.find((c) => !taken.some((t) => hits(t, box(c.ly))));
    if (spot) taken.push(box(spot.ly));
    return {
      name: l.name,
      x,
      y,
      elev: l.elev,
      major: major(l),
      labelText: spot ? text : null,
      labelY: spot ? spot.ly : y,
      above: spot ? spot.above : true,
      anchor,
    };
  });
  // restore left-to-right draw order
  return out.sort((a, b) => a.x - b.x);
}
