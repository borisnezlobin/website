import type { Mask } from "./index";

// The article hero canopy — fills the top, arcs up over the centre.
export const canopyMask: Mask = (x, y, w, h) => {
    const u = x / w;
    const wob = Math.sin(x * 0.018 + 0.6) * 0.022 + Math.sin(x * 0.052) * 0.014;
    const by = h * (0.5 + 0.2 * (2 * u - 1) ** 2 + wob);
    return Math.max(0, Math.min(1, (by - y) / (h * 0.09)));
};

// A horizontal rule — a slim band that fades top/bottom and tapers at the ends.
export const dividerMask: Mask = (x, y, w, h) => {
    const yFade = 1 - ((y - h / 2) / (h / 2)) ** 2;                  // dense at the mid-line, fading up/down
    const xFade = Math.min(1, (Math.min(x, w - x) / (w * 0.16)) ** 1.2); // taper toward the ends
    const wob = Math.sin(x * 0.05) * 0.12;
    return Math.max(0, (yFade + wob) * xFade);
};

// Stable 0..1 value from a string, so a slug always produces the same texture.
export const hashSeed = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100000) / 100000;
};
