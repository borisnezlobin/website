"use client";

import { useEffect, useRef, useState } from "react";

import { plateColors, stepSlice } from "@/app/lib/sliced-shader/plate";
import { createSlicedProgram, type SlicedProgram } from "@/app/lib/sliced-shader/program";
import { drawnLengthOf, Illustration, loadIllustration } from "./illustration-geometry";

interface QuoteShaderProps {
    text: string;
    source: string;
    illustrated: boolean;
    active: boolean;
    className?: string;
}

const BAND_FRAC = 0.01;
const AMP_FRAC = 0.013;
const TEXT_EFFECT = 0.2;

const RECT_MAX_WIDTH = 1088;

const LEFT_BORDER_STROKE = 1.2;
const LEFT_BORDER_VB_HEIGHT = 149.53333;

const ILLUSTRATIONS = [
    {
        path: "/drawings/cornerborder.svg",
        strokeWidth: 0.5,
        place: (w: number, h: number) => {
            const ch = h;
            const cw = ch * (132.89981 / 49.860859);
            return { cx: w + 0.14 * RECT_MAX_WIDTH - cw - 2, cy: -0.524 * h, cw, ch };
        },
    },
    {
        path: "/drawings/leftborder.svg",
        strokeWidth: LEFT_BORDER_STROKE,
        place: (w: number, h: number) => {
            const ch = 1.6 * h;
            const cw = ch * (117.12772 / LEFT_BORDER_VB_HEIGHT);
            const strokePx = LEFT_BORDER_STROKE * (ch / LEFT_BORDER_VB_HEIGHT);
            return { cx: -0.071 * RECT_MAX_WIDTH, cy: -0.135 * h - strokePx, cw, ch };
        },
    },
];

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
}

export function QuoteShader({ text, source, illustrated, active, className = "" }: QuoteShaderProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(active);
    const illustratedRef = useRef(illustrated);
    const propsRef = useRef({ text, source });
    const dirtyRef = useRef(true);
    const [failed, setFailed] = useState(false);

    activeRef.current = active;
    illustratedRef.current = illustrated;
    propsRef.current = { text, source };
    dirtyRef.current = true;

    useEffect(() => {
        const host = hostRef.current;
        const canvas = canvasRef.current;
        if (!host || !canvas) return;
        const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
        if (!gl) {
            setFailed(true);
            return;
        }

        let program: SlicedProgram;
        try {
            program = createSlicedProgram(gl);
        } catch (e) {
            console.error("QuoteShader:", e);
            setFailed(true);
            return;
        }

        const DPR = Math.min(window.devicePixelRatio || 1, 2);

        type Sprite = {
            tex: WebGLTexture;
            src: HTMLCanvasElement;
            seed: number;
            cx: number;
            cy: number;
            cw: number;
            ch: number;
            localMargin: number;
            ampScale: number;
            damageScale: number;
            optional: boolean;
            usesDrawProgress: boolean;
            place: (w: number, h: number) => { cx: number; cy: number; cw: number; ch: number };
            paint: (drawProgress: number) => void;
        };

        const makeTex = () => program.makeTexture();
        const beginPaint = (s: Sprite) => {
            const w = s.cw + 2 * s.localMargin;
            const h = s.ch + 2 * s.localMargin;
            s.src.width = Math.max(1, Math.round(w * DPR));
            s.src.height = Math.max(1, Math.round(h * DPR));
            const ctx = s.src.getContext("2d")!;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            ctx.clearRect(0, 0, w, h);
            return ctx;
        };
        const endPaint = (s: Sprite) => program.upload(s.tex, s.src);
        const fontPxNow = () => Math.max(8, Math.min(24, window.innerWidth * 0.03));

        const sprites: Sprite[] = [];

        const rectFill: Sprite = {
            tex: makeTex(), src: document.createElement("canvas"), seed: 7.0,
            cx: 0, cy: 0, cw: 0, ch: 0, localMargin: 0, ampScale: 1, damageScale: 1,
            optional: false, usesDrawProgress: false,
            place: (w, h) => ({ cx: 0, cy: 0, cw: w, ch: h }),
            paint: () => {
                const ctx = beginPaint(rectFill);
                ctx.fillStyle = plateColors().bg;
                ctx.fillRect(rectFill.localMargin, rectFill.localMargin, rectFill.cw, rectFill.ch);
                endPaint(rectFill);
            },
        };
        sprites.push(rectFill);

        const textSprite: Sprite = {
            tex: makeTex(), src: document.createElement("canvas"), seed: 23.0,
            cx: 0, cy: 0, cw: 0, ch: 0, localMargin: 0, ampScale: TEXT_EFFECT, damageScale: TEXT_EFFECT,
            optional: false, usesDrawProgress: false,
            place: (w, h) => ({ cx: 0, cy: 0, cw: w, ch: h }),
            paint: () => {
                const ctx = beginPaint(textSprite);
                const c = plateColors();
                const lm = textSprite.localMargin;
                const fontPx = fontPxNow();
                const lineHeight = fontPx * 1.2;
                const maxWidth = Math.min(textSprite.cw - 64, 768);
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = c.text;
                ctx.font = `600 ${fontPx}px charter, Georgia, serif`;
                const lines = wrapLines(ctx, propsRef.current.text, maxWidth);
                const cxc = lm + textSprite.cw / 2;
                const startY = lm + textSprite.ch / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;
                lines.forEach((l, i) => ctx.fillText(l, cxc, startY + i * lineHeight));
                const sourcePx = Math.max(11, fontPx * 0.72);
                ctx.font = `${sourcePx}px "Courier New", monospace`;
                ctx.fillStyle = c.source;
                ctx.fillText(propsRef.current.source, cxc, lm + textSprite.ch - sourcePx * 1.4);
                endPaint(textSprite);
            },
        };
        sprites.push(textSprite);

        ILLUSTRATIONS.forEach((ill, i) => {
            let geom: Illustration | null = null;
            const s: Sprite = {
                tex: makeTex(), src: document.createElement("canvas"), seed: 11.0 + i * 5,
                cx: 0, cy: 0, cw: 0, ch: 0, localMargin: 0, ampScale: 1, damageScale: 1,
                optional: true, usesDrawProgress: true,
                place: (w, h) => ill.place(w, h),
                paint: (drawProgress) => {
                    const ctx = beginPaint(s);
                    if (geom && drawProgress > 0.001) {
                        ctx.save();
                        ctx.translate(s.localMargin, s.localMargin);
                        ctx.scale(s.cw / geom.vbW, s.ch / geom.vbH);
                        ctx.strokeStyle = plateColors().line;
                        ctx.lineWidth = ill.strokeWidth;
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        for (const run of geom.runs) {
                            const drawnLength = drawnLengthOf(run, drawProgress);
                            if (drawnLength <= 0) continue;
                            ctx.setLineDash([run.length]);
                            ctx.lineDashOffset = run.length - drawnLength;
                            ctx.stroke(run.path);
                        }
                        ctx.restore();
                    }
                    endPaint(s);
                },
            };
            sprites.push(s);
            loadIllustration(ill.path).then((g) => {
                geom = g;
                dirtyRef.current = true;
            });
        });

        let regionX = 0;
        let regionY = 0;

        const layout = (boxW: number, boxH: number) => {
            for (const s of sprites) {
                const r = s.place(boxW, boxH);
                s.cx = r.cx;
                s.cy = r.cy;
                s.cw = r.cw;
                s.ch = r.ch;
                s.localMargin = Math.max(r.cw * AMP_FRAC * s.ampScale, 4) + 12;
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const s of sprites) {
                if (s.optional && !illustratedRef.current) continue;
                minX = Math.min(minX, s.cx - s.localMargin);
                minY = Math.min(minY, s.cy - s.localMargin);
                maxX = Math.max(maxX, s.cx + s.cw + s.localMargin);
                maxY = Math.max(maxY, s.cy + s.ch + s.localMargin);
            }
            regionX = minX;
            regionY = minY;
            const regionW = maxX - minX;
            const regionH = maxY - minY;
            canvas.style.left = `${minX}px`;
            canvas.style.top = `${minY}px`;
            canvas.style.width = `${regionW}px`;
            canvas.style.height = `${regionH}px`;
            canvas.width = Math.max(1, Math.round(regionW * DPR));
            canvas.height = Math.max(1, Math.round(regionH * DPR));
        };

        let fontsReady = false;
        document.fonts.ready.then(() => {
            fontsReady = true;
            dirtyRef.current = true;
        });

        let slice = { value: 0, velocity: 0 };
        let drawn = 0;
        let lastTime = performance.now();
        let lastW = 0, lastH = 0, lastTheme = "", lastIllustrated = false, lastDrawn = -1;
        let raf = 0;

        const render = () => {
            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            const rect = host.getBoundingClientRect();
            const boxW = Math.max(1, Math.round(rect.width));
            const boxH = Math.max(1, Math.round(rect.height));
            const theme = document.documentElement.classList.contains("dark") ? "d" : "l";

            const sliceTarget = activeRef.current ? 1 : 0;
            slice = stepSlice(slice, sliceTarget, dt);
            const drawTarget = illustratedRef.current ? 1 : 0;
            drawn += (drawTarget - drawn) * Math.min(1, dt * 6);
            if (Math.abs(drawTarget - drawn) < 0.001) drawn = drawTarget;

            const layoutChanged =
                boxW !== lastW || boxH !== lastH || theme !== lastTheme || illustratedRef.current !== lastIllustrated;
            if (layoutChanged) {
                lastW = boxW;
                lastH = boxH;
                lastTheme = theme;
                lastIllustrated = illustratedRef.current;
                dirtyRef.current = true;
            }
            if (dirtyRef.current && fontsReady) {
                layout(boxW, boxH);
                for (const s of sprites) if (!s.usesDrawProgress) s.paint(0);
                lastDrawn = -1;
                dirtyRef.current = false;
            }
            if (fontsReady && Math.abs(drawn - lastDrawn) > 0.004) {
                for (const s of sprites) if (s.usesDrawProgress) s.paint(drawn);
                lastDrawn = drawn;
            }

            program.clear();
            for (const s of sprites) {
                if (s.optional && drawn < 0.001) continue;
                program.draw({
                    tex: s.tex,
                    quad: {
                        x: (s.cx - s.localMargin - regionX) * DPR,
                        y: (s.cy - s.localMargin - regionY) * DPR,
                        w: (s.cw + 2 * s.localMargin) * DPR,
                        h: (s.ch + 2 * s.localMargin) * DPR,
                    },
                    progress: slice.value,
                    bandPx: Math.max(2, s.cw * BAND_FRAC) * DPR,
                    amp: s.cw * AMP_FRAC * s.ampScale * DPR,
                    damage: s.damageScale,
                    seed: s.seed,
                });
            }

            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(raf);
            program.dispose();
        };
    }, []);

    if (failed) {
        return (
            <div className={`${className} flex items-center justify-center bg-dark-background dark:bg-light-background`}>
                <p className="text-dark dark:text-light font-semibold text-center px-8" style={{ fontSize: "clamp(0.25rem, 3vw, 1.5rem)" }}>
                    {text}
                </p>
            </div>
        );
    }

    return (
        <div ref={hostRef} className={className} style={{ overflow: "visible" }}>
            <canvas ref={canvasRef} aria-hidden className="absolute pointer-events-none" />
        </div>
    );
}
