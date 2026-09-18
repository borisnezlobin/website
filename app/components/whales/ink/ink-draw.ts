import type { InkCloud } from "./ink-cloud";
import { neighbourhood, WIDEST_POOL } from "./ink-neighbours";
import type { InkStyle } from "./ink-style";

const PAD = 115;
const FLASH_CLEARANCE = 34;
const EYE_ARRIVES = 0.5;

function generator(seed: number) {
    let state = seed >>> 0;
    const next = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
        next,
        seedTo: (value: number) => { state = value >>> 0; },
        int: (n: number) => Math.floor(next() * n),
        span: (a: number, b: number) => a + next() * (b - a),
        normal: (sigma: number) => {
            const u = Math.max(next(), 1e-9);
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next()) * sigma;
        },
    };
}

function rank(mark: number, block: number) {
    let h = Math.imul(mark ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13) ^ block, 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export type InkDrawer = {
    strokes(
        context: CanvasRenderingContext2D,
        frame: number,
        scale: number,
        style: InkStyle,
        tick?: number,
        reveal?: number,
    ): boolean;
    random(): number;
};

export function makeDrawer(cloud: InkCloud): InkDrawer {
    const { count, size } = cloud;
    const room = 64;
    const px = new Float32Array(count + room);
    const py = new Float32Array(count + room);
    const alive = new Uint8Array(count + room);
    const flashNear = new Int16Array(room * WIDEST_POOL);
    const near = new Float32Array(WIDEST_POOL);
    const who = new Int16Array(WIDEST_POOL);
    const gen = generator(9973);

    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (let f = 0; f < cloud.frames; f += 1) {
        for (let i = 0; i < count; i += 1) {
            const x = cloud.points[f * count * 2 + i * 2];
            const y = cloud.points[f * count * 2 + i * 2 + 1];
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
    }
    const inner = [PAD, PAD, size[0] - PAD, size[1] - PAD];
    const swept = [left - FLASH_CLEARANCE, top - FLASH_CLEARANCE,
                   right + FLASH_CLEARANCE, bottom + FLASH_CLEARANCE];
    const lanes = [
        [inner[0], inner[1], Math.max(swept[0], inner[0] + 1), inner[3]],
        [Math.min(swept[2], inner[2] - 1), inner[1], inner[2], inner[3]],
        [inner[0], inner[1], inner[2], Math.max(swept[1], inner[1] + 1)],
        [inner[0], Math.min(swept[3], inner[3] - 1), inner[2], inner[3]],
    ];
    const laneArea = lanes.map(([x0, y0, x1, y1]) => Math.max(0, (x1 - x0) * (y1 - y0)));
    const laneTotal = laneArea.reduce((sum, area) => sum + area, 0);

    const frameBox: [number, number, number, number][] = [];
    for (let f = 0; f < cloud.frames; f += 1) {
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        for (let i = 0; i < count; i += 1) {
            const x = cloud.points[f * count * 2 + i * 2];
            const y = cloud.points[f * count * 2 + i * 2 + 1];
            if (x < l) l = x;
            if (x > r) r = x;
            if (y < t) t = y;
            if (y > b) b = y;
        }
        frameBox.push([l, t, r, b]);
    }

    const glyph = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, shape: number) => {
        ctx.beginPath();
        switch (shape) {
            case 0: ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
                    ctx.moveTo(x - s, y + s); ctx.lineTo(x + s, y - s); break;
            case 1: ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s * 0.8);
                    ctx.lineTo(x - s, y + s * 0.8); ctx.closePath(); break;
            case 2: ctx.arc(x, y, s, 0, Math.PI * 2); break;
            case 3: ctx.moveTo(x, y - s); ctx.lineTo(x + s, y);
                    ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); break;
            case 4: for (let k = 0; k < 6; k += 1) {
                        const a = (Math.PI * k) / 6;
                        ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s);
                        ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
                    } break;
            case 5: ctx.moveTo(x - s * 0.4, y - s); ctx.lineTo(x + s * 0.3, y - s * 0.1);
                    ctx.lineTo(x - s * 0.2, y + s * 0.1); ctx.lineTo(x + s * 0.4, y + s); break;
            case 6: for (let k = 0; k < 18; k += 1) {
                        const a = k * 0.5;
                        const r = (s * k) / 18;
                        const fx = x + Math.cos(a) * r;
                        const fy = y + Math.sin(a) * r;
                        if (k) ctx.lineTo(fx, fy); else ctx.moveTo(fx, fy);
                    } break;
            default: ctx.moveTo(x - s, y - s * 0.5); ctx.lineTo(x, y + s * 0.5);
                     ctx.lineTo(x + s, y - s * 0.5); break;
        }
        ctx.stroke();
    };

    const strokes = (
        ctx: CanvasRenderingContext2D,
        frame: number,
        scale: number,
        style: InkStyle,
        tick: number = frame,
        reveal: number = 1,
    ) => {
        const f = ((frame % cloud.frames) + cloud.frames) % cloud.frames;
        const hold = Math.max(1, style.hold ?? 1);
        const block = Math.floor(tick / hold);
        gen.seedTo(style.seed * 7919 + block * 104729);
        const table = neighbourhood(cloud, f);
        if (!table) return false;
        const total = count + style.flashCount;
        const base = f * count * 2;
        for (let i = 0; i < count; i += 1) {
            px[i] = cloud.points[base + i * 2];
            py[i] = cloud.points[base + i * 2 + 1];
            alive[i] = 1;
        }

        const weightOf = (i: number) => {
            if (i >= count) return 1;
            const pale = cloud.pale[i] / 255;
            const lift = Math.min(Math.max((pale - style.paleEdge) / (1 - style.paleEdge), 0), 1);
            return 1 - style.paleRelief * lift;
        };
        const finOf = (i: number) => (i >= count || cloud.fin[i] === 255 ? NaN : cloud.fin[i] / 254);

        const [bl, bt, br, bb] = frameBox[f];
        const reach = style.flashDistance;
        for (let k = 0; k < style.flashCount; k += 1) {
            const i = count + k;
            if (reach > 0) {
                switch (gen.int(4)) {
                    case 0: px[i] = gen.span(bl - reach, bl); py[i] = gen.span(bt - reach, bb + reach); break;
                    case 1: px[i] = gen.span(br, br + reach); py[i] = gen.span(bt - reach, bb + reach); break;
                    case 2: px[i] = gen.span(bl - reach, br + reach); py[i] = gen.span(bt - reach, bt); break;
                    default: px[i] = gen.span(bl - reach, br + reach); py[i] = gen.span(bb, bb + reach); break;
                }
            } else {
                let pick = gen.next() * laneTotal;
                let lane = 0;
                while (lane < 3 && pick > laneArea[lane]) { pick -= laneArea[lane]; lane += 1; }
                px[i] = gen.span(lanes[lane][0], lanes[lane][2]);
                py[i] = gen.span(lanes[lane][1], lanes[lane][3]);
            }
            alive[i] = gen.next() < style.flashChance ? 1 : 0;

            let filled = 0;
            let worst = Infinity;
            for (let j = 0; j < count; j += 1) {
                const dx = px[j] - px[i];
                const dy = py[j] - py[i];
                const span = dx * dx + dy * dy;
                if (filled === WIDEST_POOL && span >= worst) continue;
                let slot = Math.min(filled, WIDEST_POOL - 1);
                while (slot > 0 && near[slot - 1] > span) {
                    near[slot] = near[slot - 1]; who[slot] = who[slot - 1]; slot -= 1;
                }
                near[slot] = span; who[slot] = j;
                if (filled < WIDEST_POOL) filled += 1;
                worst = near[filled - 1];
            }
            flashNear.set(who, k * WIDEST_POOL);
        }

        const density = style.density * (1 - style.densityFlicker * gen.next());
        const pool = Math.min(style.nearPool, WIDEST_POOL);

        ctx.save();
        ctx.scale(scale, scale);
        ctx.lineWidth = style.lineWidth;
        ctx.lineCap = style.bow ? "round" : "butt";
        ctx.lineJoin = "round";

        const paths = [new Path2D(), ...style.accents.map(() => new Path2D())];
        for (let i = 0; i < total; i += 1) {
            if (!alive[i] || gen.next() >= density) continue;
            const weightI = weightOf(i);
            const finI = finOf(i);
            for (let slot = 0; slot < style.degree; slot += 1) {
                let j: number;
                if (gen.next() < style.longChance) j = gen.int(total);
                else if (i < count) j = table[i * WIDEST_POOL + 1 + gen.int(pool - 1)];
                else j = flashNear[(i - count) * WIDEST_POOL + gen.int(pool)];
                if (j === i || !alive[j]) continue;

                const dx = px[j] - px[i];
                const dy = py[j] - py[i];
                const span = Math.sqrt(dx * dx + dy * dy);
                if (span > style.maxSpan && i < count && j < count) continue;
                if (gen.next() >= Math.sqrt(weightI * weightOf(j))) continue;
                const finJ = finOf(j);
                if (finI === finI && finJ === finJ) {
                    if (style.finSeparation > 0 && Math.abs(finI - finJ) > style.finSeparation) continue;
                    if (style.finMaxSpan > 0 && (finI > 0.5 || finJ > 0.5) && span > style.finMaxSpan) continue;
                }
                const path = paths[gen.next() < style.accentChance ? 1 + gen.int(style.accents.length) : 0];
                const ax = px[i] + gen.normal(style.scatter);
                const ay = py[i] + gen.normal(style.scatter);
                const bx = px[j] + gen.normal(style.scatter);
                const by = py[j] + gen.normal(style.scatter);
                const swing = style.bow ? gen.span(-style.bow, style.bow) : 0;
                if (reveal < 1 && rank(i * 64 + slot, block) > reveal) continue;
                path.moveTo(ax, ay);
                if (!swing) path.lineTo(bx, by);
                // The control point sits off the middle of the chord along its
                // own perpendicular, which is as long as the chord, so the bow
                // is a fraction of the span however far the two points are.
                else path.quadraticCurveTo(
                    (ax + bx) / 2 - (by - ay) * swing,
                    (ay + by) / 2 + (bx - ax) * swing,
                    bx,
                    by,
                );
            }
        }
        const colours = [style.ink, ...style.accents];
        for (let c = 0; c < paths.length; c += 1) {
            ctx.strokeStyle = `rgb(${colours[c][0]},${colours[c][1]},${colours[c][2]})`;
            ctx.stroke(paths[c]);
        }

        for (let i = 0; i < total; i += 1) {
            if (!alive[i] || gen.next() >= style.nodeChance) continue;
            const c = style.accents[gen.int(style.accents.length)];
            if (reveal < 1 && rank(i, block + 1) > reveal) continue;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            ctx.beginPath();
            ctx.arc(px[i], py[i], style.nodeRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineWidth = style.lineWidth * (style.symbolWeight ?? 1);
        for (let s = 0; s < style.symbolCount; s += 1) {
            const i = gen.int(count);
            const c = style.accents[gen.int(style.accents.length)];
            const size = gen.span(style.symbolSize[0], style.symbolSize[1]);
            const shape = gen.int(8);
            if ((s + 1) / style.symbolCount > reveal) continue;
            ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            glyph(ctx, px[i], py[i], size, shape);
        }
        ctx.lineWidth = style.lineWidth;

        if (style.eyeSize > 0 && reveal >= EYE_ARRIVES) {
            const ex = cloud.eye[f * 2];
            const ey = cloud.eye[f * 2 + 1];
            ctx.strokeStyle = `rgb(${style.ink[0]},${style.ink[1]},${style.ink[2]})`;
            ctx.beginPath();
            ctx.arc(ex, ey, style.eyeSize, 0, Math.PI * 2);
            ctx.moveTo(ex - style.eyeSize, ey);
            ctx.lineTo(ex + style.eyeSize, ey);
            ctx.stroke();
        }
        ctx.restore();
        return true;
    };

    return { strokes, random: gen.next };
}
