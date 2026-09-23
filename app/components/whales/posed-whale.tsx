"use client";

import { useEffect, useRef, useState } from "react";
import { loadCatalog, type WhaleBehaviorPath, type WhaleVisualState } from "./whale-catalog";
import { invertsInDark, isDrawnLive, NEGATIVE_IN_DARK } from "./ink/ink-painter";
import { CROSSFADE_MS, makeInkStage, type InkStage } from "./ink/ink-stage";

type PosedWhaleProps = {
    style: string;
    behavior: string;
    frame: number;
    tilt: number;
    facing?: "left" | "right";
    className?: string;
};

type PosedPose = {
    path: WhaleBehaviorPath;
    mirrored: boolean;
};

const INK_BEATS_PER_SECOND = 15;
const VIEW_SLACK = 100;
const RETRY_PAINT_MS = 16;

function handoverMs() {
    if (typeof window === "undefined") return CROSSFADE_MS;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : CROSSFADE_MS;
}

export function PosedWhale({ style, behavior, frame, tilt, facing, className = "" }: PosedWhaleProps) {
    const surface = useRef<HTMLCanvasElement>(null);
    const shownState = useRef<WhaleVisualState>("calm");
    const repaintSoon = useRef<(() => void) | null>(null);
    const stage = useRef<InkStage | null>(null);
    const [staged, setStaged] = useState(0);
    const [pose, setPose] = useState<PosedPose | null>(null);
    const [visualState, setVisualState] = useState<WhaleVisualState>("calm");

    useEffect(() => () => {
        stage.current?.close();
        stage.current = null;
    }, []);

    useEffect(() => {
        if (!isDrawnLive(style)) return;
        if (stage.current) {
            stage.current.show(style);
            repaintSoon.current?.();
            return;
        }
        const inkingMs = handoverMs();
        stage.current = makeInkStage(style, inkingMs, inkingMs);
        stage.current.want(behavior);
        setStaged((count) => count + 1);
    }, [style, behavior]);

    useEffect(() => {
        stage.current?.want(behavior);
    }, [behavior, staged]);

    useEffect(() => {
        let live = true;
        loadCatalog(style)
            .then((catalog) => {
                if (live) setPose({ path: catalog.behaviors[behavior], mirrored: catalog.mirrored });
            })
            .catch(() => undefined);
        return () => { live = false; };
    }, [style, behavior]);

    useEffect(() => {
        const canvas = surface.current;
        const context = canvas?.getContext("2d");
        const ink = stage.current;
        if (!canvas || !context || !ink) return;

        const stillness = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let live = true;
        let request = 0;
        let timer = 0;
        let painted = false;
        let lastBeat = -1;
        let visible = false;
        const started = performance.now();
        const beatMs = 1000 / INK_BEATS_PER_SECOND;

        const cancelPaint = () => {
            cancelAnimationFrame(request);
            clearTimeout(timer);
            request = 0;
            timer = 0;
        };

        const queuePaint = (inMs = 0) => {
            if (request || timer || !live || !visible) return;
            if (inMs <= 0) {
                request = requestAnimationFrame(paint);
                return;
            }
            timer = window.setTimeout(() => {
                timer = 0;
                queuePaint();
            }, inMs);
        };
        const untilNextBeat = () => {
            const elapsed = performance.now() - started;
            return Math.max(1, beatMs - (elapsed % beatMs) + 1);
        };

        const matchPixelSize = () => {
            const box = canvas.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            const width = Math.max(1, Math.round(box.width * ratio));
            const height = Math.max(1, Math.round(box.height * ratio));
            if (canvas.width === width && canvas.height === height) return;
            canvas.width = width;
            canvas.height = height;
            painted = false;
        };

        const inView = () => {
            const box = canvas.getBoundingClientRect();
            return box.bottom > -VIEW_SLACK && box.top < window.innerHeight + VIEW_SLACK
                && box.right > -VIEW_SLACK && box.left < window.innerWidth + VIEW_SLACK;
        };

        const beatAt = (now: number) => (stillness
            ? 0
            : Math.floor(((now - started) / 1000) * INK_BEATS_PER_SECOND));

        const record = (drawn: number, beat: number) => {
            if (drawn < 0) return;
            painted = true;
            lastBeat = beat;
            canvas.dataset.whaleFrame = String(drawn);
            canvas.dataset.whaleBeat = String(beat);
        };

        const bookNext = (drawn: number, crossing: boolean) => {
            if (crossing) return queuePaint();
            if (stillness && painted) return;
            queuePaint(drawn >= 0 ? untilNextBeat() : RETRY_PAINT_MS);
        };

        const paint = () => {
            if (!live) return;
            request = 0;
            if (!visible) return;
            const now = performance.now();
            const beat = beatAt(now);
            const crossing = ink.crossing();
            canvas.dataset.whaleCrossing = crossing ? "1" : "0";
            if (painted && beat === lastBeat && !crossing) {
                queuePaint(untilNextBeat());
                return;
            }
            const drawn = ink.paint(context, behavior, frame, shownState.current, beat, now);
            record(drawn, beat);
            bookNext(drawn, crossing);
        };

        matchPixelSize();
        visible = inView();
        ink.setActive(visible);
        if (visible) paint();
        const visibilityObserver = new IntersectionObserver(([entry]) => {
            visible = Boolean(entry?.isIntersecting);
            ink.setActive(visible);
            if (visible) queuePaint();
            else cancelPaint();
        }, { rootMargin: `${VIEW_SLACK}px` });
        visibilityObserver.observe(canvas);
        const resizeObserver = new ResizeObserver(() => {
            matchPixelSize();
            painted = false;
            cancelPaint();
            queuePaint();
        });
        resizeObserver.observe(canvas);
        repaintSoon.current = () => {
            cancelPaint();
            queuePaint();
        };

        return () => {
            live = false;
            repaintSoon.current = null;
            ink.setActive(false);
            visibilityObserver.disconnect();
            resizeObserver.disconnect();
            cancelPaint();
        };
    }, [staged, behavior, frame]);

    const wear = (state: WhaleVisualState) => {
        shownState.current = state;
        setVisualState(state);
        repaintSoon.current?.();
    };

    const path = pose?.path ?? null;
    const flipped = facing ? facing === "left" : Boolean(pose?.mirrored);

    return (
        <div
            className={`pointer-events-none ${className}`}
            style={{
                aspectRatio: path ? `${1 / path.frameAspect}` : undefined,
                transform: `rotate(${tilt}deg)${flipped ? " scaleX(-1)" : ""}`,
            }}
        >
            <canvas
                ref={surface}
                data-whale-style={style}
                data-whale-route="posed"
                data-whale-behavior={behavior}
                data-visual-state={visualState}
                className={`absolute inset-0 block h-full w-full ${invertsInDark(style) ? NEGATIVE_IN_DARK : ""}`}
            />
            {path && (
                <div
                    className="pointer-events-auto absolute inset-0"
                    style={{ clipPath: `inset(${path.hitInset.map((value) => `${value}%`).join(" ")})` }}
                    onPointerEnter={() => wear("hover")}
                    onPointerLeave={() => wear("calm")}
                />
            )}
        </div>
    );
}
