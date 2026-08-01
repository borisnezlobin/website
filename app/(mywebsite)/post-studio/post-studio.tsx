"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DownloadSimple, VideoCamera, Stop } from "@phosphor-icons/react/dist/ssr";
import { createSpinDrive } from "../writing/[slug]/spin-drive";
import {
    variantMask, SIZES, drawComposition, slugify,
    type Align, type Composition, type Content, type Format, type Palette, type Pos, type Theme, type Variant,
} from "./post-canvas";

export type StudioArticle = { title: string; description: string; category: string; slug: string };

const titleCase = (s: string) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

const RECORD_MIMES = ["video/mp4;codecs=avc1.42E01E", "video/mp4"];

const linkFor = (slug: string) => `borisnezlobin.com/writing/${slug}`;

function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function Seg<T extends string>({ value, options, onChange }: {
    value: T; options: { v: T; label: string }[]; onChange: (v: T) => void;
}) {
    return (
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] p-1">
            {options.map((o) => (
                <button
                    key={o.v}
                    onClick={() => onChange(o.v)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        value === o.v
                            ? "bg-light-background dark:bg-dark-background shadow-sm font-medium"
                            : "text-muted dark:text-muted-dark hover:text-black dark:hover:text-white"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="text-sm text-muted dark:text-muted-dark">{label}</span>
            <div className="mt-1.5">{children}</div>
        </label>
    );
}

const inputClass =
    "w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:focus:border-primary-dark";

export function PostStudio({ articles }: { articles: StudioArticle[] }) {
    const startIdx = Math.max(0, articles.findIndex((a) => /visyn/i.test(a.title) || /visyn/i.test(a.slug)));
    const [idx, setIdx] = useState(startIdx);
    const seed = articles[idx];

    const [title, setTitle] = useState(seed?.title ?? "Untitled");
    const [description, setDescription] = useState(seed?.description ?? "");
    const [eyebrow, setEyebrow] = useState(seed ? titleCase(seed.category) : "Writing");
    const [link, setLink] = useState(seed ? linkFor(seed.slug) : "");

    const [format, setFormat] = useState<Format>("4:5");
    const [variant, setVariant] = useState<Variant>("field");
    const [slantAngle, setSlantAngle] = useState(0.28);
    const [slantHeight, setSlantHeight] = useState(0.5);
    const [cell, setCell] = useState(20);
    const [theme, setTheme] = useState<Theme>("light");
    const [pos, setPos] = useState<Pos>("bottom");
    const [align, setAlign] = useState<Align>("left");
    const [titleScale, setTitleScale] = useState(1);
    const [showDescription, setShowDescription] = useState(true);

    const [fontsReady, setFontsReady] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recSecs, setRecSecs] = useState(6);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawRef = useRef<Composition>(null!);
    const colorsRef = useRef<{ light: Palette; dark: Palette }>({
        light: { bg: "#f5f5f5", text: "#3c3c3c", muted: "#707070", accent: "#cc2a26" },
        dark: { bg: "#1a1714", text: "#d0d0d0", muted: "#949494", accent: "#e96457" },
    });
    const recorderRef = useRef<MediaRecorder | null>(null);
    const virtualRaf = useRef(0);
    // Content regions (fractions) fed back from the last frame, so the texture mask avoids the text.
    const contentRef = useRef<Content>({ top: 0.55, boxes: [] });
    const slantRef = useRef({ angle: 0.28, height: 0.5 }); // live slant params (no engine remount on change)

    // The card carries its own theme (independent of the page), resolved to the site's real colours.
    const colors = colorsRef.current[theme];

    const pickArticle = (i: number) => {
        setIdx(i);
        const a = articles[i];
        if (a) { setTitle(a.title); setDescription(a.description); setEyebrow(titleCase(a.category)); setLink(linkFor(a.slug)); }
    };

    // Live composition + slant params read by the render loop each frame.
    drawRef.current = { eyebrow, title, description, link, showDescription, pos, align, titleScale, colors };
    slantRef.current = { angle: slantAngle, height: slantHeight };

    useEffect(() => {
        // Resolve the site's real palette for both themes. Dark values only live under `.dark`, so
        // read them off a detached probe carrying that class — correct whatever theme the page is.
        const read = (el: Element): Palette => {
            const cs = getComputedStyle(el);
            const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
            return {
                bg: v("--background", "#f5f5f5"),
                text: v("--text-color", "#3c3c3c"),
                muted: v("--text-muted-color", "#707070"),
                accent: v("--primary", "#cc2a26"),
            };
        };
        // Force each theme on the root momentarily (synchronous — no paint between) to read both
        // palettes correctly no matter which theme the page is currently in.
        const root = document.documentElement, body = document.body;
        const rootDark = root.classList.contains("dark"), bodyDark = body.classList.contains("dark");
        root.classList.remove("dark"); body.classList.remove("dark");
        colorsRef.current.light = read(root);
        root.classList.add("dark");
        colorsRef.current.dark = read(root);
        if (!rootDark) root.classList.remove("dark");
        if (bodyDark) body.classList.add("dark");
        let alive = true;
        Promise.all([
            document.fonts.load("700 96px charter"),
            document.fonts.load("400 41px charter"),
            document.fonts.load("54px vectra"),
        ]).catch(() => {}).finally(() => { if (alive) setFontsReady(true); });
        return () => { alive = false; };
    }, []);

    // (Re)mount the spin-drive whenever a structural option changes; text updates flow through drawRef.
    useEffect(() => {
        if (!fontsReady || !canvasRef.current) return;
        const mask = variantMask(variant, () => ({
            content: contentRef.current, angle: slantRef.current.angle, height: slantRef.current.height,
        }));
        return createSpinDrive(canvasRef.current, mask, {
            cell,
            size: SIZES[format],
            theme,
            primary: colors.accent,
            background: colors.bg,
            onFrame: (ctx, w, h) => { contentRef.current = drawComposition(ctx, w, h, drawRef.current); },
        });
    }, [fontsReady, format, variant, cell, theme, colors]);

    const aspect = useMemo(() => { const s = SIZES[format]; return s.w / s.h; }, [format]);

    const downloadPng = () => {
        canvasRef.current?.toBlob((b) => b && download(b, `${slugify(title)}.png`), "image/png");
    };

    // Drive the light along a slow looping sweep by dispatching synthetic pointer moves, so the
    // recording has deliberate motion rather than the subtle idle drift.
    const startVirtualCursor = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const t0 = performance.now();
        const step = () => {
            const rect = canvas.getBoundingClientRect();
            const t = (performance.now() - t0) / 1000;
            const u = 0.5 + 0.42 * Math.sin(t * 0.55);
            const v = 0.5 + 0.40 * Math.sin(t * 0.42 + 1.2);
            canvas.dispatchEvent(new PointerEvent("pointermove", {
                clientX: rect.left + u * rect.width,
                clientY: rect.top + v * rect.height,
            }));
            virtualRaf.current = requestAnimationFrame(step);
        };
        virtualRaf.current = requestAnimationFrame(step);
    };
    const stopVirtualCursor = () => {
        if (virtualRaf.current) cancelAnimationFrame(virtualRaf.current);
        virtualRaf.current = 0;
        canvasRef.current?.dispatchEvent(new PointerEvent("pointerleave"));
    };

    const toggleRecord = () => {
        if (recording) { recorderRef.current?.stop(); return; }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const mime = RECORD_MIMES.find((m) => MediaRecorder.isTypeSupported(m));
        if (!mime) { alert("This browser can't record MP4 — try Chrome or Safari."); return; }
        const stream = canvas.captureStream(30);
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
        const chunks: BlobPart[] = [];
        rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
            stopVirtualCursor();
            download(new Blob(chunks, { type: "video/mp4" }), `${slugify(title)}.mp4`);
            setRecording(false);
            recorderRef.current = null;
        };
        recorderRef.current = rec;
        rec.start();
        setRecording(true);
        startVirtualCursor();
        setTimeout(() => { if (recorderRef.current === rec && rec.state !== "inactive") rec.stop(); }, recSecs * 1000);
    };

    return (
        <div className="pagepad">
            <div className="mb-6">
                <h1 className="text-3xl">Post studio</h1>
                <p className="text-muted dark:text-muted-dark mt-1">
                    Wrap an article in the spin-drive texture for Instagram. Move your cursor over the canvas to steer the light.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
                {/* Preview */}
                <div className="flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] p-4 lg:p-8 min-h-[40vh]">
                    <canvas
                        ref={canvasRef}
                        style={{ aspectRatio: String(aspect) }}
                        className="block max-h-[72vh] max-w-full w-auto rounded-lg shadow-xl"
                    />
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-5">
                    <Field label="Article">
                        <select
                            value={idx}
                            onChange={(e) => pickArticle(Number(e.target.value))}
                            className={inputClass}
                        >
                            {articles.map((a, i) => (
                                <option key={a.slug} value={i}>{a.title}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Eyebrow">
                        <input className={inputClass} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
                    </Field>

                    <Field label="Title">
                        <textarea className={inputClass} rows={2} value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>

                    <Field label="Description">
                        <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </Field>

                    <Field label="Link (footer)">
                        <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="borisnezlobin.com/writing/…" />
                    </Field>

                    <Field label="Format">
                        <Seg value={format} onChange={setFormat} options={[
                            { v: "1:1", label: "1:1" }, { v: "4:5", label: "4:5" }, { v: "9:16", label: "9:16" },
                        ]} />
                    </Field>

                    <Field label="Texture">
                        <Seg value={variant} onChange={setVariant} options={[
                            { v: "field", label: "Field" }, { v: "slant", label: "Slant" }, { v: "bloom", label: "Bloom" },
                        ]} />
                    </Field>

                    {variant === "slant" && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={`Slant angle — ${slantAngle > 0 ? "↘" : slantAngle < 0 ? "↗" : "—"}`}>
                                <input type="range" min={-0.6} max={0.6} step={0.02} value={slantAngle} onChange={(e) => setSlantAngle(Number(e.target.value))} className="w-full accent-primary" />
                            </Field>
                            <Field label={`Slant height — ${Math.round(slantHeight * 100)}%`}>
                                <input type="range" min={0.2} max={0.8} step={0.02} value={slantHeight} onChange={(e) => setSlantHeight(Number(e.target.value))} className="w-full accent-primary" />
                            </Field>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Theme">
                            <Seg value={theme} onChange={setTheme} options={[
                                { v: "light", label: "Light" }, { v: "dark", label: "Dark" },
                            ]} />
                        </Field>
                        <Field label="Align">
                            <Seg value={align} onChange={setAlign} options={[
                                { v: "left", label: "Left" }, { v: "center", label: "Center" },
                            ]} />
                        </Field>
                    </div>

                    <Field label="Text position">
                        <Seg value={pos} onChange={setPos} options={[
                            { v: "top", label: "Top" }, { v: "center", label: "Center" }, { v: "bottom", label: "Bottom" },
                        ]} />
                    </Field>

                    <Field label={`Density — ${cell}px cells`}>
                        <input type="range" min={12} max={36} value={cell} onChange={(e) => setCell(Number(e.target.value))} className="w-full accent-primary" />
                    </Field>

                    <Field label={`Title size — ${titleScale.toFixed(2)}×`}>
                        <input type="range" min={0.75} max={1.4} step={0.05} value={titleScale} onChange={(e) => setTitleScale(Number(e.target.value))} className="w-full accent-primary" />
                    </Field>

                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={showDescription} onChange={(e) => setShowDescription(e.target.checked)} className="accent-primary" />
                        Show description
                    </label>

                    <div className="h-px bg-black/10 dark:bg-white/10" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadPng}
                            className="flex items-center justify-center gap-2 rounded-lg bg-primary dark:bg-primary-dark text-light-background dark:text-dark-background px-4 py-2.5 font-medium hover:opacity-90 transition-opacity"
                        >
                            <DownloadSimple size={18} /> PNG
                        </button>
                        <button
                            onClick={toggleRecord}
                            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors ${
                                recording
                                    ? "bg-primary/15 text-primary dark:text-primary-dark"
                                    : "bg-black/[0.06] dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/15"
                            }`}
                        >
                            {recording ? <><Stop size={18} weight="fill" /> Stop</> : <><VideoCamera size={18} /> Record</>}
                        </button>
                        <Seg value={String(recSecs)} onChange={(v) => setRecSecs(Number(v))} options={[
                            { v: "3", label: "3s" }, { v: "6", label: "6s" }, { v: "9", label: "9s" },
                        ]} />
                    </div>
                    <p className="text-xs text-muted dark:text-muted-dark -mt-2">
                        Records MP4. The light auto-sweeps across the frame while recording.
                    </p>
                </div>
            </div>
        </div>
    );
}
