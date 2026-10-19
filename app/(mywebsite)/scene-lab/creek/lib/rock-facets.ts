import { drawSpinFacets, type SpinColors, type SpinRect } from "@/app/lib/spin-drive";
import { rockDepth, rockShapes, type RockShape } from "./creek-layout";

/**
 * The rocks painted with the site's spin-drive texture: faceted triangles that catch a slowly
 * drifting light, drawn into an offscreen canvas that a direction composites (or uploads).
 */
export type RockFacetLayer = {
    canvas: HTMLCanvasElement;
    rocks: RockShape[];
    /** The outline of every rock, for filling the stone underneath the facets. */
    silhouette: Path2D;
    paint: (time: number, colors: SpinColors) => void;
};

const DENSITY_STEP = 3;

const rasterizeDensity = (rocks: RockShape[], width: number, height: number, softEdge: number) => {
    const cols = Math.ceil(width / DENSITY_STEP), rows = Math.ceil(height / DENSITY_STEP);
    const density = new Float32Array(cols * rows);
    for (const rock of rocks) {
        const reach = rock.radius * 1.4 * rock.stretch;
        const i0 = Math.max(0, Math.floor((rock.x - reach) / DENSITY_STEP)), i1 = Math.min(cols - 1, Math.ceil((rock.x + reach) / DENSITY_STEP));
        const j0 = Math.max(0, Math.floor((rock.y - reach) / DENSITY_STEP)), j1 = Math.min(rows - 1, Math.ceil((rock.y + reach) / DENSITY_STEP));
        for (let j = j0; j <= j1; j++) {
            for (let i = i0; i <= i1; i++) {
                const depth = rockDepth(rock, (i + 0.5) * DENSITY_STEP, (j + 0.5) * DENSITY_STEP);
                density[j * cols + i] = Math.max(density[j * cols + i], Math.min(1, depth / softEdge));
            }
        }
    }
    return { cols, rows, density };
};

const rockRect = (rock: RockShape, pad: number): SpinRect => {
    const reach = rock.radius * 1.25 * rock.stretch + pad;
    return { x: rock.x - reach, y: rock.y - reach, w: reach * 2, h: reach * 2 };
};

const overlaps = (a: SpinRect, b: SpinRect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const union = (a: SpinRect, b: SpinRect): SpinRect => {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** Merges overlapping rectangles so redrawing one never clears facets painted for another. */
export function mergeRects(rects: SpinRect[]) {
    const merged = [...rects];
    for (let a = 0; a < merged.length; a++) {
        for (let b = a + 1; b < merged.length; b++) {
            if (!overlaps(merged[a], merged[b])) continue;
            merged[a] = union(merged[a], merged[b]);
            merged.splice(b, 1);
            b = a;
        }
    }
    return merged;
}

const OUTLINE_POINTS = 72;

export function rockSilhouette(rocks: RockShape[]) {
    const path = new Path2D();
    for (const rock of rocks) {
        for (let p = 0; p <= OUTLINE_POINTS; p++) {
            const angle = (p / OUTLINE_POINTS) * Math.PI * 2;
            const r = rock.edge(angle);
            const x = rock.x + Math.cos(angle) * r, y = rock.y + Math.sin(angle) * r * rock.stretch;
            if (p === 0) path.moveTo(x, y); else path.lineTo(x, y);
        }
        path.closePath();
    }
    return path;
}

export const driftingLight = (time: number, width: number, height: number) => ({
    x: width * (0.5 + 0.32 * Math.sin(time * 0.21) + 0.08 * Math.sin(time * 0.53)),
    y: height * (0.35 + 0.28 * Math.sin(time * 0.16 + 1) + 0.06 * Math.sin(time * 0.41)),
});

export function createRockFacetLayer(width: number, height: number, dpr: number, options: { cell: number; intensity?: number; rocks?: RockShape[] }): RockFacetLayer {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rocks = options.rocks ?? rockShapes(width, height);
    const { cols, rows, density } = rasterizeDensity(rocks, width, height, options.cell * 1.1);
    const rects = mergeRects(rocks.map((rock) => rockRect(rock, options.cell * 2)));
    const mask = (cx: number, cy: number) => {
        const i = Math.floor(cx / DENSITY_STEP), j = Math.floor(cy / DENSITY_STEP);
        if (i < 0 || j < 0 || i >= cols || j >= rows) return 0;
        return density[j * cols + i];
    };
    return {
        canvas,
        rocks,
        silhouette: rockSilhouette(rocks),
        paint: (time, colors) => {
            const light = driftingLight(time, width, height);
            for (const rect of rects) {
                drawSpinFacets(ctx, { w: width, h: height, t: time, light, colors, mask, cell: options.cell, intensity: options.intensity ?? 1, rect });
            }
        },
    };
}
