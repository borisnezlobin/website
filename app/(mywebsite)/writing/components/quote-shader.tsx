"use client";

import { useEffect, useRef, useState } from "react";

interface QuoteShaderProps {
    text: string;
    source: string;
    illustrated: boolean;
    active: boolean;
    className?: string;
}

const BAND_FRAC = 0.01;
const AMP_FRAC = 0.013;
// The text/source feel the shader at this fraction of the rectangle's strength.
const TEXT_EFFECT = 0.2;

const ILLUSTRATIONS = [
    {
        path: "/drawings/cornerborder.svg",
        strokeWidth: 0.5,
        place: (w: number, h: number) => {
            const ch = h;
            const cw = ch * (132.89981 / 49.860859);
            return { cx: w + 0.14 * w - cw, cy: -0.524 * h, cw, ch };
        },
    },
    {
        path: "/drawings/leftborder.svg",
        strokeWidth: 0.7,
        place: (w: number, h: number) => {
            const ch = 1.6 * h;
            const cw = ch * (117.12772 / 149.53333);
            return { cx: -0.071 * w, cy: -0.135 * h, cw, ch };
        },
    },
];

const VERT = `
attribute vec2 aUnit;
uniform vec4 uQuad;   // x, y, w, h in canvas pixels
uniform vec2 uCanvas; // canvas size in pixels
varying vec2 vUv;
void main() {
    vec2 p = uQuad.xy + aUnit * uQuad.zw;
    gl_Position = vec4(p.x / uCanvas.x * 2.0 - 1.0, 1.0 - p.y / uCanvas.y * 2.0, 0.0, 1.0);
    vUv = aUnit;
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uProgress;
uniform float uBandPx;
uniform float uAmp;
uniform float uDamage;
uniform float uSeed;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(float x) {
    float i = floor(x), f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}
vec4 samp(vec2 uv) {
    return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(uTex, uv);
}

void main() {
    vec2 px = vUv * uRes;
    vec2 dir = normalize(vec2(1.0, -1.0));
    vec2 nrm = vec2(-dir.y, dir.x);

    // Band index in band-width units; small values keep the hash unbiased (no net drift).
    float t = dot(px, nrm) / uBandPx;
    // Bounded monotonic warp -> variable band widths (thin and thick) with no overlap.
    t += 0.45 * vnoise(t * 0.4 + uSeed) + 0.22 * vnoise(t * 1.1 + uSeed * 2.0);
    float band = floor(t);

    // Symmetric, zero-mean per-band shift so content doesn't drift; ~12% spike hard.
    float r = hash(band + uSeed * 17.0) - 0.5;
    float spike = step(0.88, hash(band + uSeed * 31.0 + 0.5));
    float disp = r * 2.0 * uAmp * (0.4 + 1.0 * spike) * uProgress;

    vec2 uv = (px + dir * disp) / uRes;
    vec4 col = samp(uv);

    // Damage the slice ends: grain-erode + fade where content meets its torn edge.
    vec2 texel = 1.0 / uRes;
    float aF = samp(uv + dir * texel * 2.5).a;
    float aB = samp(uv - dir * texel * 2.5).a;
    float edge = max(abs(col.a - aF), abs(col.a - aB));
    float tornness = clamp(abs(disp) / max(uAmp, 0.001), 0.0, 1.0);
    float fray = edge * (0.35 + 0.9 * tornness);
    float grain = hash2(floor(px / 1.6) + uSeed);
    float fine = hash2(floor(px) * 1.7 + uSeed * 2.0);
    col.a *= 1.0 - step(0.5, grain) * fray * 1.4 * uProgress * uDamage;
    col.a *= 1.0 - fine * edge * 0.4 * uProgress * uDamage;
    col.a = clamp(col.a, 0.0, 1.0);

    gl_FragColor = col;
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
    }
    return sh;
}

function themeColors() {
    const isDark = document.documentElement.classList.contains("dark");
    return {
        bg: isDark ? "#f5f5f5" : "#1a1714",
        text: isDark ? "#3c3c3c" : "#d0d0d0",
        source: isDark ? "#707070" : "#949494",
        line: isDark ? "#d0d0d0" : "#3c3c3c",
    };
}

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

interface PathGeom {
    path: Path2D;
    length: number;
}

async function loadIllustration(url: string): Promise<{ vbW: number; vbH: number; paths: PathGeom[] } | null> {
    try {
        const text = await (await fetch(url)).text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (!svg) return null;
        const vb = (svg.getAttribute("viewBox") || "0 0 1 1").split(/\s+/).map(Number);
        const measure = svg.cloneNode(true) as SVGSVGElement;
        Object.assign(measure.style, { position: "absolute", visibility: "hidden", pointerEvents: "none" });
        document.body.appendChild(measure);
        const paths: PathGeom[] = Array.from(measure.querySelectorAll("path")).map((p) => ({
            path: new Path2D(p.getAttribute("d") || ""),
            length: p.getTotalLength(),
        }));
        document.body.removeChild(measure);
        return { vbW: vb[2] || 1, vbH: vb[3] || 1, paths };
    } catch {
        return null;
    }
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

        let program: WebGLProgram;
        try {
            program = gl.createProgram()!;
            gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
            gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program) || "link failed");
            }
        } catch (e) {
            console.error("QuoteShader:", e);
            setFailed(true);
            return;
        }

        gl.useProgram(program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
        const aUnit = gl.getAttribLocation(program, "aUnit");
        gl.enableVertexAttribArray(aUnit);
        gl.vertexAttribPointer(aUnit, 2, gl.FLOAT, false, 0, 0);

        const u = {
            quad: gl.getUniformLocation(program, "uQuad"),
            canvas: gl.getUniformLocation(program, "uCanvas"),
            res: gl.getUniformLocation(program, "uRes"),
            progress: gl.getUniformLocation(program, "uProgress"),
            bandPx: gl.getUniformLocation(program, "uBandPx"),
            amp: gl.getUniformLocation(program, "uAmp"),
            damage: gl.getUniformLocation(program, "uDamage"),
            seed: gl.getUniformLocation(program, "uSeed"),
        };

        const DPR = Math.min(window.devicePixelRatio || 1, 2);

        // Each element is its own sliced sprite, so the rectangle fill and illustrations can
        // tear at full strength while the text barely moves (ampScale/damageScale = TEXT_EFFECT).
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
            optional: boolean; // only drawn when illustrated
            usesDrawProgress: boolean;
            place: (w: number, h: number) => { cx: number; cy: number; cw: number; ch: number };
            paint: (drawProgress: number) => void;
        };

        const makeTex = () => {
            const tex = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            return tex;
        };
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
        const endPaint = (s: Sprite) => {
            gl.bindTexture(gl.TEXTURE_2D, s.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.src);
        };
        const fontPxNow = () => Math.max(8, Math.min(24, window.innerWidth * 0.03));

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        const sprites: Sprite[] = [];

        // Rectangle fill — full effect.
        const rectFill: Sprite = {
            tex: makeTex(), src: document.createElement("canvas"), seed: 7.0,
            cx: 0, cy: 0, cw: 0, ch: 0, localMargin: 0, ampScale: 1, damageScale: 1,
            optional: false, usesDrawProgress: false,
            place: (w, h) => ({ cx: 0, cy: 0, cw: w, ch: h }),
            paint: () => {
                const ctx = beginPaint(rectFill);
                ctx.fillStyle = themeColors().bg;
                ctx.fillRect(rectFill.localMargin, rectFill.localMargin, rectFill.cw, rectFill.ch);
                endPaint(rectFill);
            },
        };
        sprites.push(rectFill);

        // Text + source — barely affected, drawn on top of the fill.
        const textSprite: Sprite = {
            tex: makeTex(), src: document.createElement("canvas"), seed: 23.0,
            cx: 0, cy: 0, cw: 0, ch: 0, localMargin: 0, ampScale: TEXT_EFFECT, damageScale: TEXT_EFFECT,
            optional: false, usesDrawProgress: false,
            place: (w, h) => ({ cx: 0, cy: 0, cw: w, ch: h }),
            paint: () => {
                const ctx = beginPaint(textSprite);
                const c = themeColors();
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

        // Border illustrations — full effect at their own (smaller) scale; draw-in animated.
        ILLUSTRATIONS.forEach((ill, i) => {
            let geom: Awaited<ReturnType<typeof loadIllustration>> | null = null;
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
                        ctx.strokeStyle = themeColors().line;
                        ctx.lineWidth = ill.strokeWidth;
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        for (const pg of geom.paths) {
                            ctx.setLineDash([pg.length]);
                            ctx.lineDashOffset = pg.length * (1 - drawProgress);
                            ctx.stroke(pg.path);
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
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        let fontsReady = false;
        document.fonts.ready.then(() => {
            fontsReady = true;
            dirtyRef.current = true;
        });

        let slice = 0;
        let sliceVel = 0;
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
            sliceVel += (110 * (sliceTarget - slice) - 10 * sliceVel) * dt;
            slice += sliceVel * dt;
            if (Math.abs(sliceTarget - slice) < 0.0005 && Math.abs(sliceVel) < 0.0005) {
                slice = sliceTarget;
                sliceVel = 0;
            }
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

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(u.canvas, canvas.width, canvas.height);

            for (const s of sprites) {
                if (s.optional && drawn < 0.001) continue;
                const qx = (s.cx - s.localMargin - regionX) * DPR;
                const qy = (s.cy - s.localMargin - regionY) * DPR;
                const qw = (s.cw + 2 * s.localMargin) * DPR;
                const qh = (s.ch + 2 * s.localMargin) * DPR;
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, s.tex);
                gl.uniform4f(u.quad, qx, qy, qw, qh);
                gl.uniform2f(u.res, qw, qh);
                gl.uniform1f(u.progress, Math.max(0, slice));
                gl.uniform1f(u.bandPx, Math.max(2, s.cw * BAND_FRAC) * DPR);
                gl.uniform1f(u.amp, s.cw * AMP_FRAC * s.ampScale * DPR);
                gl.uniform1f(u.damage, s.damageScale);
                gl.uniform1f(u.seed, s.seed);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(raf);
            for (const s of sprites) gl.deleteTexture(s.tex);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
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
