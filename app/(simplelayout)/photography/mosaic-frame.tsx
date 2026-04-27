"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/app/lib/photo-types";
import type { MosaicCell } from "@/app/lib/mosaic";
import type { MosaicMode } from "./use-mosaic-state";
import {
  poseForTile,
  useMosaicTiles,
  type Tile,
} from "./mosaic-tile-data";
import { useMosaicImages } from "./use-mosaic-images";
import {
  drawMosaic,
  fillPositions,
  hitTestTile,
} from "./mosaic-canvas-render";

const ANIM_MS = 900;
const STAGGER_BUCKETS = 50;
const STAGGER_STEP_MS = 6;
const PREVIEW_SCALE = 4;
const LONG_PRESS_MS = 320;

type Props = {
  photos: Photo[];
  cells: MosaicCell[];
  mode: MosaicMode;
  gridSize: number;
  side: number;
  onOpenPhoto: (photoId: string) => void;
};

export default function MosaicFrame({ photos, cells, mode, gridSize, side, onOpenPhoto }: Props) {
  const cellSize = side / gridSize;
  const range = side - cellSize;
  const tiles = useMosaicTiles(photos, cells, gridSize);
  const { imagesRef, loadVersion } = useMosaicImages(photos);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const fromRef = useRef<Float32Array | null>(null);
  const targetRef = useRef<Float32Array | null>(null);
  // Bezier control point — only set during mosaic→mosaic transitions, where
  // we route each tile through its jumble position so there's visible motion
  // between two grids with otherwise-identical cell coordinates.
  const midRef = useRef<Float32Array | null>(null);
  const useBezierRef = useRef(false);
  // Tiles snapshot from the previous category. During the first half of a
  // mosaic→mosaic animation we draw these (old photos at interpolated
  // positions); we swap to the new tiles at each tile's individual midpoint.
  const prevTilesRef = useRef<Tile[]>([]);
  const animPrevTilesRef = useRef<Tile[] | null>(null);
  const prevModeRef = useRef<MosaicMode>(mode);
  const animStartRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const previewIndexRef = useRef<number | null>(null);
  const [, forceRedraw] = useState(0);
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);

  // Allocate / re-allocate position buffers whenever tile count changes.
  useEffect(() => {
    const total = tiles.length;
    if (total === 0) {
      positionsRef.current = null;
      fromRef.current = null;
      targetRef.current = null;
      return;
    }
    if (!positionsRef.current || positionsRef.current.length !== total * 4) {
      positionsRef.current = new Float32Array(total * 4);
      fillPositions(positionsRef.current, tiles, (i) => poseForTile(tiles[i], mode, cellSize, range));
      fromRef.current = new Float32Array(total * 4);
      targetRef.current = new Float32Array(total * 4);
    }
  }, [tiles, mode, cellSize, range]);

  const stopAnim = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const positions = positionsRef.current;
    if (!canvas || !ctx || !positions || tiles.length === 0) return;
    drawMosaic(ctx, tiles, positions, cellSize, side, imagesRef.current, previewIndexRef.current, dpr);
  }, [tiles, cellSize, side, imagesRef, dpr]);

  // Animation loop — interpolates positions from `fromRef` to `targetRef`
  // with a per-tile stagger that mirrors the old CSS `transition-delay`.
  // For mosaic→mosaic transitions, runs through the bezier control in
  // `midRef` so tiles visibly scatter and re-form, and swaps the rendered
  // photo from old to new at each tile's local midpoint.
  const startAnim = useCallback(() => {
    stopAnim();
    animStartRef.current = performance.now();
    const tick = () => {
      const positions = positionsRef.current;
      const from = fromRef.current;
      const target = targetRef.current;
      if (!positions || !from || !target) {
        rafRef.current = null;
        return;
      }
      const elapsed = performance.now() - animStartRef.current;
      let stillAnimating = false;
      const total = tiles.length;
      const useBezier = useBezierRef.current;
      const mid = useBezier ? midRef.current : null;
      const prevTiles = animPrevTilesRef.current;
      const tilesToDraw: Tile[] = new Array(total);
      for (let i = 0; i < total; i++) {
        const delay = (i % STAGGER_BUCKETS) * STAGGER_STEP_MS;
        const local = elapsed - delay;
        const t = local <= 0 ? 0 : local >= ANIM_MS ? 1 : local / ANIM_MS;
        if (t < 1) stillAnimating = true;
        const e = easeInOutCubic(t);
        const o = i * 4;
        if (mid) {
          const u = 1 - e;
          const u2 = u * u;
          const e2 = e * e;
          const ue2 = 2 * u * e;
          positions[o] = u2 * from[o] + ue2 * mid[o] + e2 * target[o];
          positions[o + 1] = u2 * from[o + 1] + ue2 * mid[o + 1] + e2 * target[o + 1];
          positions[o + 2] = u2 * from[o + 2] + ue2 * mid[o + 2] + e2 * target[o + 2];
          positions[o + 3] = u2 * from[o + 3] + ue2 * mid[o + 3] + e2 * target[o + 3];
        } else {
          positions[o] = from[o] + (target[o] - from[o]) * e;
          positions[o + 1] = from[o + 1] + (target[o + 1] - from[o + 1]) * e;
          positions[o + 2] = from[o + 2] + (target[o + 2] - from[o + 2]) * e;
          positions[o + 3] = from[o + 3] + (target[o + 3] - from[o + 3]) * e;
        }
        tilesToDraw[i] =
          useBezier && prevTiles && t < 0.5 && prevTiles[i] ? prevTiles[i] : tiles[i];
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        drawMosaic(ctx, tilesToDraw, positions, cellSize, side, imagesRef.current, previewIndexRef.current, dpr);
      }
      rafRef.current = stillAnimating ? requestAnimationFrame(tick) : null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [tiles, cellSize, side, imagesRef, dpr, stopAnim]);

  // When mode (or layout) changes, snapshot current positions as `from` and
  // compute new targets, then animate. For mosaic→mosaic transitions also
  // populate `mid` (jumble positions of the new tiles) and capture the
  // previous tiles so the rAF loop can swap photos at each tile's midpoint.
  useEffect(() => {
    const positions = positionsRef.current;
    const target = targetRef.current;
    const from = fromRef.current;
    if (!positions || !target || !from || tiles.length === 0) return;

    const wasMosaic = prevModeRef.current === "mosaic";
    const isMosaic = mode === "mosaic";
    const prev = prevTilesRef.current;
    const isMosaicSwap = wasMosaic && isMosaic && prev.length === tiles.length;
    prevModeRef.current = mode;

    from.set(positions);
    fillPositions(target, tiles, (i) => poseForTile(tiles[i], mode, cellSize, range));

    if (isMosaicSwap) {
      if (!midRef.current || midRef.current.length !== tiles.length * 4) {
        midRef.current = new Float32Array(tiles.length * 4);
      }
      // Route through new tiles' jumble positions — tiles visibly scatter
      // before settling into the new grid.
      fillPositions(midRef.current, tiles, (i) => poseForTile(tiles[i], "jumble", cellSize, range));
      useBezierRef.current = true;
      animPrevTilesRef.current = prev;
    } else {
      useBezierRef.current = false;
      animPrevTilesRef.current = null;
    }

    prevTilesRef.current = tiles;
    startAnim();
    return stopAnim;
  }, [tiles, mode, cellSize, range, startAnim, stopAnim]);

  // Repaint when more photo images finish loading.
  useEffect(() => {
    if (rafRef.current === null) draw();
  }, [loadVersion, draw]);

  // ---- pointer interaction ----
  const longPressRef = useRef<{ tileIndex: number; timer: number; moved: boolean } | null>(null);

  const localPoint = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const tileAt = useCallback((x: number, y: number): Tile | null => {
    if (!positionsRef.current) return null;
    return hitTestTile(tiles, positionsRef.current, cellSize, x, y, previewIndexRef.current);
  }, [tiles, cellSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const p = localPoint(e);
    if (!p) return;
    const t = tileAt(p.x, p.y);
    if (!t) return;
    longPressRef.current = {
      tileIndex: t.index,
      moved: false,
      timer: window.setTimeout(() => {
        const lp = longPressRef.current;
        if (!lp || lp.moved) return;
        previewIndexRef.current = lp.tileIndex;
        const positions = positionsRef.current;
        if (positions) positions[lp.tileIndex * 4 + 3] = PREVIEW_SCALE;
        draw();
        forceRedraw((n) => n + 1);
      }, LONG_PRESS_MS),
    };
  };

  const handlePointerMove = () => {
    if (longPressRef.current) longPressRef.current.moved = true;
  };

  const handlePointerEnd = () => {
    const lp = longPressRef.current;
    if (lp) {
      clearTimeout(lp.timer);
      longPressRef.current = null;
    }
    if (previewIndexRef.current !== null) {
      const positions = positionsRef.current;
      if (positions && tiles[previewIndexRef.current]) {
        const pose = poseForTile(tiles[previewIndexRef.current], mode, cellSize, range);
        positions[previewIndexRef.current * 4 + 3] = pose.scale;
      }
      previewIndexRef.current = null;
      draw();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (longPressRef.current?.moved) return;
    if (previewIndexRef.current !== null) return;
    const p = localPoint(e);
    if (!p) return;
    const t = tileAt(p.x, p.y);
    if (!t) return;
    onOpenPhoto(t.photo.id);
  };

  return (
    <canvas
      ref={canvasRef}
      width={Math.round(side * dpr)}
      height={Math.round(side * dpr)}
      style={{ width: side, height: side, cursor: "pointer", touchAction: "manipulation" }}
      className="bg-black/5 dark:bg-white/5 rounded-md select-none"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
    />
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
