// Composition drawn on top of the spin-drive texture for an Instagram-ready card.
// Everything is painted into the canvas (not a DOM overlay) so a still export or a
// captureStream recording both include the text.

import { Mask } from "@/app/lib/spin-drive";

export type Format = "1:1" | "4:5" | "9:16";
export type Variant = "field" | "slant" | "bloom";
export type Pos = "top" | "center" | "bottom";
export type Align = "left" | "center";
export type Theme = "light" | "dark";

// Resolved from the site's own CSS variables, so cards match the site exactly.
export type Palette = { bg: string; text: string; muted: string; accent: string };

export type Composition = {
    eyebrow: string;
    title: string;
    description: string;
    link: string;
    showDescription: boolean;
    pos: Pos;
    align: Align;
    titleScale: number;
    colors: Palette;
};

// Instagram's three staple aspect ratios, all at 1080px wide.
export const SIZES: Record<Format, { w: number; h: number }> = {
    "1:1": { w: 1080, h: 1080 },
    "4:5": { w: 1080, h: 1350 },
    "9:16": { w: 1080, h: 1920 },
};

// The composition's occupied regions, one box per rendered line (so the texture avoids the real
// ragged silhouette, not a single rectangle spanning the widest line). `top` is the block's top,
// used by field/slant for their boundary. Fed back from the previous frame.
export type Box = { l: number; r: number; t: number; b: number };
export type Content = { top: number; boxes: Box[] };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
};

// Fraction of the frame over which the texture ramps in around content edges. Wide + smooth so the
// words feel worked into the pattern instead of punched out of it.
const FEATHER = 0.09;

// 1 well outside a box, 0 inside, smoothly ramping over FEATHER.
const outsideBox = (u: number, v: number, b: Box) => {
    const d = Math.max(Math.max(b.l - u, 0, u - b.r), Math.max(b.t - v, 0, v - b.b));
    return smoothstep(0, FEATHER, d);
};

// Smooth flowing noise (a few octaves of sine) for bloom's organic blobs.
const noise2 = (x: number, y: number) =>
    (Math.sin(x * 0.0055 + y * 0.004) + Math.sin(x * 0.009 - y * 0.011 + 1.7) +
        Math.sin((x + y) * 0.006 + 3.1) + Math.sin((x - y) * 0.008 - 0.6)) / 4;

// All three variants show the SAME untouched texture — only the shape of where it's allowed differs:
//   field — everything above a horizontal line at the content top
//   slant — everything above a diagonal line (configurable angle + height)
//   bloom — sparse organic blobs scattered across the whole card
// Each fades out smoothly around every content line so nothing runs under the words.
export function variantMask(
    variant: Variant,
    get: () => { content: Content; angle: number; height: number },
): Mask {
    return (cx, cy, w, h) => {
        const u = cx / w, v = cy / h;
        const { content, angle, height } = get();
        let avoid = 1;
        for (const b of content.boxes) {
            avoid = Math.min(avoid, outsideBox(u, v, b));
            if (avoid < 0.02) return 0;
        }
        let fill: number;
        if (variant === "field") {
            fill = smoothstep(0, 0.11, content.top - v) * 0.72;
        } else if (variant === "slant") {
            fill = smoothstep(0, 0.11, height + angle * (u - 0.5) - v) * 0.72;
        } else {
            fill = 0.1 + smoothstep(0.12, 0.42, noise2(cx, cy)) * 0.55;
        }
        return clamp01(fill * avoid);
    };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
        let line = "";
        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            const test = line ? `${line} ${word}` : word;
            if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; }
            else line = test;
        }
        lines.push(line);
    }
    return lines;
}

export const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post";

const TITLE_PX = 104;
const TITLE_MIN = 40;
const DESC_PX = 40;
const EYEBROW_PX = 30;
const SIG_PX = 52;
const LINK_PX = 27;
const MAX_DESC_LINES = 4;
const ASC = 0.8; // cap-height as a fraction of font size, for Charter

export function drawComposition(ctx: CanvasRenderingContext2D, w: number, h: number, c: Composition): Content {
    const { text, muted, accent } = c.colors;
    const margin = Math.round(w * 0.078);
    const maxW = w - margin * 2;
    const centered = c.align === "center";
    const anchorX = centered ? w / 2 : margin;
    ctx.textBaseline = "alphabetic";

    // ---- Footer: link stacked over the wordmark, bottom-left, with clear separation ----
    let linkPx = LINK_PX;
    if (c.link) {
        ctx.font = `${linkPx}px charter, serif`;
        while (ctx.measureText(c.link).width > maxW && linkPx > 15) { linkPx--; ctx.font = `${linkPx}px charter, serif`; }
    }
    const sigCap = SIG_PX * 0.72;
    const linkGap = c.link ? Math.round(SIG_PX * 0.5) : 0; // generous space between URL and wordmark
    const footerH = sigCap + linkGap + (c.link ? linkPx : 0);
    const footerTop = h - margin - footerH;

    // ---- Content zone ----
    const zoneTop = Math.round(margin * 1.15);
    const zoneBottom = footerTop - Math.round(h * 0.05);
    const zoneH = zoneBottom - zoneTop;

    ctx.font = `400 ${DESC_PX}px charter, serif`;
    const descLines = c.showDescription && c.description ? wrap(ctx, c.description, maxW).slice(0, MAX_DESC_LINES) : [];
    const descLead = DESC_PX * 1.42;
    const descH = descLines.length ? DESC_PX + descLines.length * descLead : 0;

    const eyebrowBox = c.eyebrow ? EYEBROW_PX * 1.5 : 0;
    const eyebrowGap = c.eyebrow ? EYEBROW_PX * 0.7 : 0;

    // ---- Auto-fit the title so the whole block fits the zone with headroom ----
    const fitTarget = zoneH * 0.86;
    let titlePx = Math.round(TITLE_PX * c.titleScale);
    let titleLines: string[] = [];
    let blockH = 0;
    for (;;) {
        ctx.font = `700 ${titlePx}px charter, serif`;
        titleLines = wrap(ctx, c.title || " ", maxW);
        blockH = eyebrowBox + eyebrowGap + titleLines.length * (titlePx * 1.1) + descH;
        if (blockH <= fitTarget || titlePx <= TITLE_MIN) break;
        titlePx -= 3;
    }
    const titleLead = titlePx * 1.1;

    let top: number;
    if (c.pos === "top") top = zoneTop;
    else if (c.pos === "center") top = zoneTop + (zoneH - blockH) / 2;
    else top = zoneBottom - blockH;
    top = Math.max(zoneTop, Math.min(top, zoneBottom - blockH));

    // ---- Text (recording a box per line, so the texture avoids the exact ragged silhouette) ----
    const boxes: Box[] = [];
    const addBox = (lineTop: number, lineH: number, lineW: number) => {
        const l = centered ? anchorX - lineW / 2 : margin;
        boxes.push({ l: l / w, r: (l + lineW) / w, t: lineTop / h, b: (lineTop + lineH) / h });
    };

    ctx.textAlign = centered ? "center" : "left";
    let y = top;

    if (c.eyebrow) {
        ctx.font = `600 ${EYEBROW_PX}px charter, serif`;
        ctx.fillStyle = accent;
        ctx.fillText(c.eyebrow, anchorX, y + EYEBROW_PX * ASC);
        addBox(y, EYEBROW_PX * 1.2, ctx.measureText(c.eyebrow).width);
        y += eyebrowBox + eyebrowGap;
    }

    ctx.font = `700 ${titlePx}px charter, serif`;
    ctx.fillStyle = text;
    for (const line of titleLines) {
        ctx.fillText(line, anchorX, y + titlePx * ASC);
        addBox(y, titleLead, ctx.measureText(line).width);
        y += titleLead;
    }

    if (descLines.length) {
        y += DESC_PX;
        ctx.font = `400 ${DESC_PX}px charter, serif`;
        ctx.fillStyle = muted;
        for (const line of descLines) {
            ctx.fillText(line, anchorX, y + DESC_PX * ASC);
            addBox(y, descLead, ctx.measureText(line).width);
            y += descLead;
        }
    }

    // ---- Footer: the link (accent + underline) then the wordmark. Always bottom-left. ----
    ctx.textAlign = "left";
    const sigBaseline = h - margin;
    if (c.link) {
        const ly = sigBaseline - sigCap - linkGap;
        ctx.font = `${linkPx}px charter, serif`;
        ctx.fillStyle = accent;
        ctx.fillText(c.link, margin, ly);
        const lw = ctx.measureText(c.link).width;
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1.5, linkPx * 0.06);
        const uy = ly + linkPx * 0.2;
        ctx.beginPath(); ctx.moveTo(margin, uy); ctx.lineTo(margin + lw, uy); ctx.stroke();
        boxes.push({ l: margin / w, r: (margin + lw) / w, t: (ly - linkPx) / h, b: (ly + linkPx * 0.3) / h });
    }
    ctx.font = `${SIG_PX}px vectra, serif`;
    ctx.fillStyle = text;
    ctx.fillText("Boris Nezlobin", margin, sigBaseline);
    const sigW = ctx.measureText("Boris Nezlobin").width;
    boxes.push({ l: margin / w, r: (margin + sigW) / w, t: (sigBaseline - sigCap) / h, b: (sigBaseline + SIG_PX * 0.2) / h });

    return { top: top / h, boxes };
}
