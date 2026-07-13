"use client";

import { useEffect } from "react";

type Tune = { size: number; nudge: number; hoffset: number };

// I tuned these by hand btw. one for each of the 26 Vectra letters innit
const CONFIG: Record<string, Tune> = {
    A: { size: 3.10, nudge: -0.48, hoffset: -0.22 },
    B: { size: 3.10, nudge: 0.38, hoffset: -1.50 },
    C: { size: 3.70, nudge: -0.57, hoffset: 0.00 },
    D: { size: 3.10, nudge: -0.16, hoffset: -0.72 },
    E: { size: 3.80, nudge: -0.47, hoffset: -0.26 },
    F: { size: 3.10, nudge: -0.42, hoffset: -0.47 },
    G: { size: 3.10, nudge: 0.51, hoffset: -0.15 },
    H: { size: 3.00, nudge: -0.10, hoffset: 0.00 },
    I: { size: 3.70, nudge: -0.48, hoffset: -0.53 },
    J: { size: 3.10, nudge: -0.48, hoffset: -0.61 },
    K: { size: 3.70, nudge: -0.89, hoffset: -0.26 },
    L: { size: 3.60, nudge: -0.50, hoffset: 0.00 },
    M: { size: 2.90, nudge: -0.70, hoffset: -0.92 },
    N: { size: 3.10, nudge: -0.64, hoffset: -1.34 },
    O: { size: 3.70, nudge: -0.18, hoffset: -1.13 },
    P: { size: 3.80, nudge: 0.23, hoffset: -0.32 },
    Q: { size: 3.40, nudge: -0.14, hoffset: -1.00 },
    R: { size: 3.10, nudge: 0.14, hoffset: -1.07 },
    S: { size: 3.10, nudge: 0.40, hoffset: -0.34 },
    T: { size: 3.60, nudge: -0.53, hoffset: -0.94 },
    U: { size: 3.10, nudge: 0.54, hoffset: -0.11 },
    V: { size: 3.50, nudge: 0.23, hoffset: -0.18 },
    W: { size: 3.50, nudge: -0.14, hoffset: -0.24 },
    X: { size: 3.90, nudge: -1.01, hoffset: -0.68 },
    Y: { size: 3.60, nudge: 0.70, hoffset: -0.26 },
    Z: { size: 3.60, nudge: 0.49, hoffset: -0.43 },
};
const DEFAULT_TUNE: Tune = { size: 3.1, nudge: 0, hoffset: 0 };
const GAP_EM = 0.4;


function findFirstLetter(p: Element) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        const text = node.textContent ?? "";
        const i = text.search(/\S/);
        if (i !== -1) return { node: node as Text, index: i, char: text[i] };
    }
    return null;
}

function buildCap(letter: string, tune: Tune, bodyPx: number): HTMLSpanElement | null {
    const fontPx = tune.size * bodyPx;
    const font = `${fontPx}px 'vectra', serif`;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.font = font;
    const m = ctx.measureText(letter);
    const pad = fontPx * 0.04;
    const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight + pad * 2);
    const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2);
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000";
    ctx.fillText(letter, m.actualBoundingBoxLeft + pad, m.actualBoundingBoxAscent + pad);
    const url = canvas.toDataURL();

    const cw = canvas.width, chh = canvas.height;
    const alpha = ctx.getImageData(0, 0, cw, chh).data;
    const rows = 48, thr = 128;
    const re: number[] = [];
    for (let r = 0; r <= rows; r++) {
        const yy = Math.min(chh - 1, Math.round((r / rows) * chh));
        let rx = 0;
        for (let px = cw - 1; px >= 0; px--) { if (alpha[(yy * cw + px) * 4 + 3] > thr) { rx = px + 1; break; } }
        re.push(rx);
    }

    const hangPx = Math.max(0, -tune.nudge * bodyPx);
    const cut = Math.min(rows, Math.ceil((hangPx / h) * rows));
    const edgeAtCut = re[cut] ?? 0;
    for (let r = 0; r < cut; r++) re[r] = Math.min(re[r], edgeAtCut);

    const pts = re.map((rx, r) => `${((rx / cw) * 100).toFixed(1)}% ${((r / rows) * 100).toFixed(1)}%`);
    const shape = `polygon(0% 0%, ${pts.join(", ")}, 0% 100%) border-box`;

    const cap = document.createElement("span");
    cap.setAttribute("aria-hidden", "true");
    const s = cap.style;
    s.setProperty("float", "left");
    s.setProperty("width", `${w}px`);
    s.setProperty("height", `${h}px`);
    s.setProperty("background-color", "var(--primary)");
    s.setProperty("mask", `url(${url}) 0 0 / ${w}px ${h}px no-repeat`);
    s.setProperty("-webkit-mask", `url(${url}) 0 0 / ${w}px ${h}px no-repeat`);
    s.setProperty("shape-outside", shape);
    s.setProperty("shape-margin", `${GAP_EM}em`);
    s.setProperty("margin-left", `${tune.hoffset}em`);
    s.setProperty("margin-right", `${GAP_EM}em`);
    s.setProperty("margin-top", `${tune.nudge}em`);
    return cap;
}

function srOnlyLetter(letter: string): HTMLSpanElement {
    const el = document.createElement("span");
    el.textContent = letter;
    const s = el.style;
    s.setProperty("position", "absolute");
    s.setProperty("width", "1px");
    s.setProperty("height", "1px");
    s.setProperty("overflow", "hidden");
    s.setProperty("clip", "rect(0 0 0 0)");
    s.setProperty("white-space", "nowrap");
    return el;
}

function enhance(p: HTMLElement, fullLede: boolean) {
    if (p.dataset.leded === "1") return;
    const info = findFirstLetter(p);
    if (!info || !/[a-z]/i.test(info.char)) return;
    const bodyPx = parseFloat(getComputedStyle(p).fontSize) || 19;
    const cap = buildCap(info.char, CONFIG[info.char.toUpperCase()] ?? DEFAULT_TUNE, bodyPx);
    if (!cap) return;
    p.dataset.leded = "1";

    const node = info.node;
    const parent = node.parentNode as Node;
    const text = node.textContent ?? "";
    const before = text.slice(0, info.index);
    const rest = text.slice(info.index + 1);

    if (fullLede) {
        const sp = rest.search(/\s/);
        const restOfWord = sp === -1 ? rest : rest.slice(0, sp);
        const word = document.createElement("span");
        word.className = "blog-lede-word";
        word.textContent = restOfWord;
        const afterNode = document.createTextNode(sp === -1 ? "" : rest.slice(sp));
        node.textContent = before;
        parent.insertBefore(afterNode, node.nextSibling);
        parent.insertBefore(word, afterNode);
        p.classList.add("blog-lede");
    } else {
        node.textContent = before + rest;
    }

    p.insertBefore(srOnlyLetter(info.char), p.firstChild);
    p.insertBefore(cap, p.firstChild);
}

export function BlogDropCap() {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try { await document.fonts.load("48px vectra", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"); } catch { /* ignore */ }
            if (cancelled) return;
            const root = document.querySelector(".blog-article");
            if (!root) return;

            const first = root.querySelector<HTMLElement>(".el-p:first-of-type > p");
            if (first) enhance(first, true);

            root.querySelectorAll(".heading-children").forEach((hc) => {
                const prev = hc.previousElementSibling;
                if (prev && (prev.tagName === "H1" || prev.tagName === "H2")) {
                    const sp = hc.querySelector<HTMLElement>(".el-p:first-of-type > p");
                    if (sp && sp !== first) enhance(sp, false);
                }
            });
        })();
        return () => { cancelled = true; };
    }, []);

    return null;
}
