
export interface StrokeRun {
    path: Path2D;
    startDistance: number;
    length: number;
    sourceLength: number;
}

export interface Illustration {
    vbW: number;
    vbH: number;
    runs: StrokeRun[];
}

interface Sample {
    x: number;
    y: number;
    distance: number;
}

const SAMPLE_STEP = 0.5;
const OVERLAP_EPSILON = 0.55;

function samplePath(element: SVGPathElement): Sample[] {
    const total = element.getTotalLength();
    if (total <= 0) return [];
    const samples: Sample[] = [];
    for (let distance = 0; distance < total; distance += SAMPLE_STEP) {
        const point = element.getPointAtLength(distance);
        samples.push({ x: point.x, y: point.y, distance });
    }
    const end = element.getPointAtLength(total);
    samples.push({ x: end.x, y: end.y, distance: total });
    return samples;
}

class SampleGrid {
    private readonly cells = new Map<string, Sample[]>();

    private key(x: number, y: number) {
        return `${Math.floor(x / OVERLAP_EPSILON)},${Math.floor(y / OVERLAP_EPSILON)}`;
    }

    add(sample: Sample) {
        const key = this.key(sample.x, sample.y);
        const bucket = this.cells.get(key);
        if (bucket) bucket.push(sample);
        else this.cells.set(key, [sample]);
    }

    hasNeighbour(x: number, y: number) {
        const cx = Math.floor(x / OVERLAP_EPSILON);
        const cy = Math.floor(y / OVERLAP_EPSILON);
        const limit = OVERLAP_EPSILON * OVERLAP_EPSILON;
        for (let ix = cx - 1; ix <= cx + 1; ix++) {
            for (let iy = cy - 1; iy <= cy + 1; iy++) {
                const bucket = this.cells.get(`${ix},${iy}`);
                if (!bucket) continue;
                for (const other of bucket) {
                    const dx = other.x - x;
                    const dy = other.y - y;
                    if (dx * dx + dy * dy <= limit) return true;
                }
            }
        }
        return false;
    }
}

function runFromSamples(samples: Sample[], sourceLength: number): StrokeRun | null {
    if (samples.length < 2) return null;
    const path = new Path2D();
    path.moveTo(samples[0].x, samples[0].y);
    let length = 0;
    for (let i = 1; i < samples.length; i++) {
        path.lineTo(samples[i].x, samples[i].y);
        length += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    }
    if (length <= 0) return null;
    return { path, startDistance: samples[0].distance, length, sourceLength };
}

function splitIntoRuns(samples: Sample[], grid: SampleGrid, sourceLength: number): StrokeRun[] {
    const runs: StrokeRun[] = [];
    let current: Sample[] = [];
    const flush = () => {
        const run = runFromSamples(current, sourceLength);
        if (run) runs.push(run);
        current = [];
    };
    for (const sample of samples) {
        if (grid.hasNeighbour(sample.x, sample.y)) flush();
        else current.push(sample);
    }
    flush();
    return runs;
}

function dedupePaths(elements: SVGPathElement[]): StrokeRun[] {
    const grid = new SampleGrid();
    const runs: StrokeRun[] = [];
    for (const element of elements) {
        const samples = samplePath(element);
        if (samples.length === 0) continue;
        runs.push(...splitIntoRuns(samples, grid, element.getTotalLength()));
        for (const sample of samples) grid.add(sample);
    }
    return runs;
}

function measureOffscreen<T>(svg: SVGSVGElement, read: (mounted: SVGSVGElement) => T): T {
    const mounted = svg.cloneNode(true) as SVGSVGElement;
    Object.assign(mounted.style, { position: "absolute", visibility: "hidden", pointerEvents: "none" });
    document.body.appendChild(mounted);
    try {
        return read(mounted);
    } finally {
        document.body.removeChild(mounted);
    }
}

export async function loadIllustration(url: string): Promise<Illustration | null> {
    try {
        const markup = await (await fetch(url)).text();
        const svg = new DOMParser().parseFromString(markup, "image/svg+xml").querySelector("svg");
        if (!svg) return null;
        const viewBox = (svg.getAttribute("viewBox") || "0 0 1 1").split(/\s+/).map(Number);
        const runs = measureOffscreen(svg, (mounted) =>
            dedupePaths(Array.from(mounted.querySelectorAll("path"))),
        );
        return { vbW: viewBox[2] || 1, vbH: viewBox[3] || 1, runs };
    } catch {
        return null;
    }
}

export function drawnLengthOf(run: StrokeRun, progress: number) {
    const reached = progress * run.sourceLength - run.startDistance;
    if (reached <= 0) return 0;
    return Math.min(reached, run.length);
}
