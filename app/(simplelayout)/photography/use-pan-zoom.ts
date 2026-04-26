"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export type View = { x: number; y: number; scale: number };

const SCALE_MIN = 0.4;
const SCALE_MAX = 2.4;
const DRAG_THRESHOLD = 3;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  moved: number;
};

type PinchState = {
  initialDist: number;
  initialScale: number;
  midX: number;
  midY: number;
  baseX: number;
  baseY: number;
};

function clampScale(s: number): number {
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, s));
}

export function usePanZoom(
  containerRef: RefObject<HTMLElement | null>,
  initial: View,
) {
  const [view, setView] = useState<View>(initial);
  const draggedRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());

  const animateTo = useCallback((target: View, ms = 400) => {
    const start = performance.now();
    let startView: View;
    setView((v) => {
      startView = v;
      return v;
    });
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setView({
        x: startView.x + (target.x - startView.x) * e,
        y: startView.y + (target.y - startView.y) * e,
        scale: startView.scale + (target.scale - startView.scale) * e,
      });
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = clampScale(v.scale * factor);
        const ratio = newScale / v.scale;
        return {
          x: v.x - px * (ratio - 1),
          y: v.y - py * (ratio - 1),
          scale: newScale,
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      draggedRef.current = false;
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: view.x,
        baseY: view.y,
        moved: 0,
      };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchRef.current = {
        initialDist: Math.hypot(dx, dy) || 1,
        initialScale: view.scale,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
        baseX: view.x,
        baseY: view.y,
      };
      dragRef.current = null;
    }
  }, [view.x, view.y, view.scale]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = dist / pinchRef.current.initialDist;
      const newScale = clampScale(pinchRef.current.initialScale * ratio);
      const realRatio = newScale / pinchRef.current.initialScale;
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      const px = pinchRef.current.midX - rect.left - rect.width / 2;
      const py = pinchRef.current.midY - rect.top - rect.height / 2;
      setView({
        x: pinchRef.current.baseX - px * (realRatio - 1),
        y: pinchRef.current.baseY - py * (realRatio - 1),
        scale: newScale,
      });
      return;
    }

    const drag = dragRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (drag.moved > DRAG_THRESHOLD) draggedRef.current = true;
      setView((v) => ({ ...v, x: drag.baseX + dx, y: drag.baseY + dy }));
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
      dragRef.current = null;
    }
  }, []);

  return {
    view,
    setView,
    animateTo,
    draggedRef,
    panZoomHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
