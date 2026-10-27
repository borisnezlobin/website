"use client";

import {
  ArrowsOutSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Selection,
} from "@phosphor-icons/react/dist/ssr";
import type { TrekLandmark } from "../lib/trek";
import { intComma, metres } from "../lib/chart";

const ZOOM_STEP = 1.6;

export function ProfileControls({
  selectMode,
  onToggleSelect,
  onZoom,
  onReset,
}: {
  selectMode: boolean;
  onToggleSelect: () => void;
  onZoom: (factor: number) => void;
  onReset: (() => void) | null;
}) {
  return (
    <div className="absolute right-2.5 top-2.5 flex gap-1">
      <CtrlBtn
        label={selectMode ? "Measuring — tap to pan again" : "Measure a stretch"}
        active={selectMode}
        onClick={onToggleSelect}
      >
        <Selection size={16} />
      </CtrlBtn>
      <CtrlBtn label="Zoom in" onClick={() => onZoom(1 / ZOOM_STEP)}>
        <MagnifyingGlassPlus size={16} />
      </CtrlBtn>
      <CtrlBtn label="Zoom out" onClick={() => onZoom(ZOOM_STEP)}>
        <MagnifyingGlassMinus size={16} />
      </CtrlBtn>
      {onReset && (
        <CtrlBtn label="Reset" onClick={onReset}>
          <ArrowsOutSimple size={16} />
        </CtrlBtn>
      )}
    </div>
  );
}

export interface ProfileHover {
  km: number;
  elev: number;
  near: TrekLandmark | null;
  per100: number;
  x: number;
}

export function HoverCard({ hover, chartWidth }: { hover: ProfileHover; chartWidth: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-[230px] rounded-md border border-neutral-200 bg-light-background/95 px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-dark-background/95"
      style={{
        left: `${(hover.x / chartWidth) * 100}%`,
        top: 8,
        // anchor to the side away from the edge so it never gets clipped
        transform: `translateX(${hover.x > chartWidth * 0.62 ? "calc(-100% - 10px)" : "10px"})`,
      }}
    >
      <div className="font-semibold text-light-foreground dark:text-dark-foreground">
        {metres(hover.elev)}
        <span className="font-normal text-muted dark:text-muted-dark"> at km {hover.km.toFixed(1)}</span>
      </div>
      <div className="mt-0.5 text-muted dark:text-muted-dark">
        {hover.per100 >= 1 ? `≈ ${hover.per100} stone steps per 100 m` : "walking grade — no steps"}
      </div>
      {hover.near && <div className="mt-0.5 text-muted dark:text-muted-dark">near {hover.near.name}</div>}
    </div>
  );
}

export function ProfileCaption({
  measured,
  viewSteps,
  zoomed,
  selectMode,
  onClear,
}: {
  measured: { steps: number; km: number } | null;
  viewSteps: number;
  zoomed: boolean;
  selectMode: boolean;
  onClear: () => void;
}) {
  return (
    <figcaption className="mt-3 text-sm text-muted dark:text-muted-dark">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: "var(--primary)" }} /> stone steps
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-neutral-400 dark:bg-neutral-500" /> walking grade
        </span>
        <span className="ml-auto font-medium tabular-nums text-light-foreground dark:text-dark-foreground">
          {measured
            ? `${intComma(measured.steps)} steps over ${measured.km.toFixed(1)} km`
            : `${intComma(viewSteps)} steps ${zoomed ? "in view" : "on the shortest route"}`}
        </span>
      </div>
      <div className="mt-1.5">
        {selectMode
          ? "Drag across the trail to measure a stretch. Tap the button again to pan."
          : "Scroll to zoom and drag to pan. Shift-drag, or tap the box, to measure a stretch."}
        {measured && (
          <button
            type="button"
            onClick={onClear}
            className="ml-2 underline hover:text-light-foreground dark:hover:text-dark-foreground"
          >
            clear
          </button>
        )}
      </div>
    </figcaption>
  );
}

function CtrlBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-md border backdrop-blur ${
        active
          ? "border-transparent text-white"
          : "border-neutral-200 bg-light-background/80 text-muted hover:text-light-foreground dark:border-neutral-700 dark:bg-dark-background/80 dark:text-muted-dark dark:hover:text-dark-foreground"
      }`}
      style={active ? { background: "var(--primary)" } : undefined}
    >
      {children}
    </button>
  );
}
