// A still frame of app/lib/spin-drive drawn as SVG paths instead of canvas calls.
// hash, shimmer, facet normals, specular, the cell split and the colour rule are the same math.

export type Mask = (x: number, y: number, w: number, h: number) => number;
export type SpinColors = { ink: string; glow: string; red: string };

export type FacetField = {
    w: number;
    h: number;
    t: number;
    cell: number;
    light: { x: number; y: number };
    colors: SpinColors;
    mask: Mask;
    intensity: number;
    maxOpacity: number;
};

type Triangle = number[];

const TAU = Math.PI * 2;
const SOLID_SHARE_THRESHOLD = 0.4;

const hash = (i: number, j: number) => {
    const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const shimmer = (x: number, y: number, t: number) =>
    (Math.sin(x * 0.015 + y * 0.01 + t * 0.5) + Math.sin((x - y) * 0.012 - t * 0.4)) * 0.25 + 0.5;

const facetNormal = (i: number, j: number): [number, number] => {
    const a = hash(i, j) * TAU;
    return [Math.cos(a), Math.sin(a)];
};

const specular = (cx: number, cy: number, nx: number, ny: number, lx: number, ly: number) => {
    const dx = lx - cx, dy = ly - cy;
    const d = Math.hypot(dx, dy) || 1;
    const align = Math.max(0, (nx * dx + ny * dy) / d);
    return align ** 5 * (0.5 + 0.5 * Math.exp(-d / 380));
};

const cellTriangles = (i: number, j: number, cell: number): [Triangle, Triangle] => {
    const x0 = i * cell, y0 = j * cell;
    return ((i + j) & 1) === 0
        ? [[x0, y0, x0 + cell, y0, x0 + cell, y0 + cell], [x0, y0, x0 + cell, y0 + cell, x0, y0 + cell]]
        : [[x0, y0, x0 + cell, y0, x0, y0 + cell], [x0 + cell, y0, x0 + cell, y0 + cell, x0, y0 + cell]];
};

const facetColor = (c: SpinColors, spec: number, sparkle: number) =>
    spec > 0.6 && sparkle > 0.9 ? c.red : spec > 0.42 ? c.glow : c.ink;

const fixed = (n: number) => n.toFixed(2);

function trianglePath(p: Triangle, cx: number, cy: number, scale: number, angle: number): string {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const corners = [0, 1, 2].map((k) => {
        const dx = (p[k * 2] - cx) * scale, dy = (p[k * 2 + 1] - cy) * scale;
        return `${fixed(cx + dx * cos - dy * sin)} ${fixed(cy + dx * sin + dy * cos)}`;
    });
    return `M${corners.join("L")}Z`;
}

function solidFacet(f: FacetField, p: Triangle, centre: [number, number], look: FacetLook): string {
    const [cx, cy] = centre;
    const opacity = Math.min(f.maxOpacity, (0.045 + look.spec * 0.85 + look.glint) * f.intensity);
    const angle = Math.sin(f.t * 0.5 + look.spin * 6) * 0.05;
    return `<path d="${trianglePath(p, cx, cy, 0.9, angle)}" fill="${look.color}" fill-opacity="${fixed(opacity)}"/>`;
}

function wireFacet(f: FacetField, p: Triangle, centre: [number, number], look: FacetLook): string {
    const [cx, cy] = centre;
    const opacity = Math.min(f.maxOpacity, (0.04 + look.spec * 0.7 + look.glint) * f.intensity);
    const width = 0.85 + look.spec * 0.9;
    return `<path d="${trianglePath(p, cx, cy, 0.82, 0)}" fill="none" stroke="${look.color}" stroke-opacity="${fixed(opacity)}" stroke-width="${fixed(width)}"/>`;
}

type FacetLook = { spec: number; glint: number; color: string; spin: number };

function paintFacet(f: FacetField, i: number, j: number, ti: number, p: Triangle): string | null {
    const cx = (p[0] + p[2] + p[4]) / 3, cy = (p[1] + p[3] + p[5]) / 3;
    const density = f.mask(cx, cy, f.w, f.h);
    if (density < 0.02 || hash(i * 2 + ti, j) > density) return null;
    const [nx, ny] = facetNormal(i * 2 + ti, j);
    const spec = specular(cx, cy, nx, ny, f.light.x, f.light.y);
    const look = {
        spec,
        glint: shimmer(cx, cy, f.t) * 0.03,
        color: facetColor(f.colors, spec, hash(i * 3 + ti, j)),
        spin: hash(i, j),
    };
    const draw = hash(i * 5 + ti, j) > SOLID_SHARE_THRESHOLD ? solidFacet : wireFacet;
    return draw(f, p, [cx, cy], look);
}

/** The field is laid out in the site's CSS pixels so every constant above keeps its meaning; `size` is the printed box in pt. */
export function spinFacetsSvg(f: FacetField, size: { w: number; h: number }): string {
    const paths: string[] = [];
    const columns = Math.ceil(f.w / f.cell), rows = Math.ceil(f.h / f.cell);
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
            const [first, second] = cellTriangles(i, j, f.cell);
            paths.push(paintFacet(f, i, j, 0, first) ?? "", paintFacet(f, i, j, 1, second) ?? "");
        }
    }
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}pt" height="${size.h}pt" viewBox="0 0 ${f.w} ${f.h}">`,
        `<g stroke-linejoin="round">${paths.join("")}</g>`,
        "</svg>",
    ].join("");
}
