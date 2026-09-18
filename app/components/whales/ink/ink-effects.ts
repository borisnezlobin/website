import type { InkStyle } from "./ink-style";

const surface = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return { c, x: c.getContext("2d")! };
};

export function makeCompositor(w: number, h: number, style: InkStyle) {
    const hasEffects = style.echoStrength > 0 || style.halo[1] > 0
        || style.smearCount > 0 || style.bandCount > 0
        || style.chromatic > 0 || style.displace > 0;

    if (!hasEffects) {
        return function composeDirect(
            out: CanvasRenderingContext2D,
            strokes: CanvasImageSource,
            underlay: CanvasImageSource | null,
            where: [number, number, number, number],
        ) {
            out.clearRect(0, 0, w, h);
            if (underlay) out.drawImage(underlay, where[0], where[1], where[2], where[3]);
            out.drawImage(strokes, 0, 0);
        };
    }

    const scratch = surface(w, h);
    const ghost = style.echoStrength > 0 ? surface(w, h) : null;
    const tinted = style.echoStrength > 0 || style.halo[1] > 0 || style.chromatic > 0
        ? surface(w, h)
        : null;
    const chan = style.chromatic > 0 ? surface(w, h) : null;
    const spare = style.smearCount > 0 || style.bandCount > 0 || style.chromatic > 0
        ? surface(w, h)
        : null;
    let hasGhost = false;

    const rgb = (c: readonly number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

    return function compose(
        out: CanvasRenderingContext2D,
        strokes: CanvasImageSource,
        underlay: CanvasImageSource | null,
        where: [number, number, number, number],
        rand: () => number,
    ) {
        const s = scratch.x;
        s.clearRect(0, 0, w, h);

        if (style.echoStrength > 0 && hasGhost) {
            const t = tinted!.x;
            t.clearRect(0, 0, w, h);
            t.globalCompositeOperation = "source-over";
            t.drawImage(ghost!.c, 0, 0);
            t.globalCompositeOperation = "multiply";
            t.fillStyle = rgb(style.echoTint);
            t.fillRect(0, 0, w, h);
            t.globalCompositeOperation = "destination-in";
            t.drawImage(ghost!.c, 0, 0);
            t.globalCompositeOperation = "source-over";
            s.globalAlpha = style.echoStrength;
            s.drawImage(tinted!.c, style.echoOffset, 0);
            s.globalAlpha = 1;
        }
        s.drawImage(strokes, 0, 0);

        if (style.echoStrength > 0) {
            const g = ghost!.x;
            g.clearRect(0, 0, w, h);
            g.drawImage(scratch.c, 0, 0);
            hasGhost = true;
        }

        if (underlay) {
            out.clearRect(0, 0, w, h);
            out.drawImage(underlay, where[0], where[1], where[2], where[3]);
            out.drawImage(scratch.c, 0, 0);
            s.clearRect(0, 0, w, h);
            s.drawImage(out.canvas, 0, 0);
        }

        if (style.halo[1] > 0) {
            const t = tinted!.x;
            t.clearRect(0, 0, w, h);
            t.filter = `blur(${style.halo[0]}px)`;
            t.globalAlpha = style.halo[1];
            t.drawImage(scratch.c, 0, 0);
            t.filter = "none";
            t.globalAlpha = 1;
            t.drawImage(scratch.c, 0, 0);
            s.clearRect(0, 0, w, h);
            s.drawImage(tinted!.c, 0, 0);
        }

        if (style.smearCount > 0 && rand() < style.smearChance) {
            for (let n = 0; n < style.smearCount; n += 1) {
                const top = Math.floor(rand() * h);
                const thick = style.bandThickness[0] + Math.floor(rand() * (style.bandThickness[1] - style.bandThickness[0]));
                const bottom = Math.min(top + thick, h);
                const dir = rand() < 0.5 ? 1 : -1;
                const p = spare!.x;
                p.clearRect(0, 0, w, h);
                for (let step = style.smearLength; step >= 1; step -= 1) {
                    p.globalAlpha = (1 - step / (style.smearLength + 1)) * 0.7;
                    p.drawImage(scratch.c, 0, top, w, bottom - top, dir * step * (style.smearStep ?? 3), top, w, bottom - top);
                }
                p.globalAlpha = 1;
                p.drawImage(scratch.c, 0, top, w, bottom - top, 0, top, w, bottom - top);
                s.clearRect(0, top, w, bottom - top);
                s.drawImage(spare!.c, 0, top, w, bottom - top, 0, top, w, bottom - top);
            }
        }

        if (style.bandCount > 0 && rand() < style.bandChance) {
            const p = spare!.x;
            p.clearRect(0, 0, w, h);
            p.drawImage(scratch.c, 0, 0);
            for (let n = 0; n < style.bandCount; n += 1) {
                const top = Math.floor(rand() * h);
                const thick = style.bandThickness[0] + Math.floor(rand() * (style.bandThickness[1] - style.bandThickness[0]));
                const bottom = Math.min(top + thick, h);
                const shift = Math.floor(rand() * (style.bandShift * 2 + 1)) - style.bandShift;
                s.clearRect(0, top, w, bottom - top);
                s.drawImage(spare!.c, 0, top, w, bottom - top, shift, top, w, bottom - top);
            }
        }

        if (style.chromatic > 0) {
            const o = style.chromatic;
            const t = tinted!.x;
            t.clearRect(0, 0, w, h);
            t.globalCompositeOperation = "lighter";
            const only = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
            const at = [-o, 0, o];
            for (let k = 0; k < 3; k += 1) {
                const cx = chan!.x;
                cx.globalCompositeOperation = "source-over";
                cx.clearRect(0, 0, w, h);
                cx.drawImage(scratch.c, 0, 0);
                cx.globalCompositeOperation = "multiply";
                cx.fillStyle = rgb(only[k]);
                cx.fillRect(0, 0, w, h);
                cx.globalCompositeOperation = "destination-in";
                cx.drawImage(scratch.c, 0, 0);
                t.drawImage(chan!.c, at[k], 0);
            }
            t.globalCompositeOperation = "source-over";

            const m = spare!.x;
            m.globalCompositeOperation = "source-over";
            m.clearRect(0, 0, w, h);
            for (let k = 0; k < 3; k += 1) m.drawImage(scratch.c, at[k], 0);
            t.globalCompositeOperation = "destination-in";
            t.drawImage(spare!.c, 0, 0);
            t.globalCompositeOperation = "source-over";

            s.clearRect(0, 0, w, h);
            s.drawImage(tinted!.c, 0, 0);
        }

        const dx = style.displace ? Math.floor(rand() * (style.displace * 2 + 1)) - style.displace : 0;
        const dy = style.displace ? Math.floor(rand() * (style.displace * 2 + 1)) - style.displace : 0;
        out.clearRect(0, 0, w, h);
        out.drawImage(scratch.c, dx, dy);
    };
}
