export type DistanceField = {
    width: number;
    height: number;
    imageWidth: number;
    pad: number;
    data: Float32Array;
};

const PAD_CELLS = 32;

const ORTHOGONAL_STEP = 3;
const DIAGONAL_STEP = 4;
const OPAQUE_ALPHA = 32;

function chamferDistance(mask: Uint8Array, width: number, height: number) {
    const distance = new Float32Array(mask.length);
    const unreached = width * height * ORTHOGONAL_STEP;

    for (let i = 0; i < mask.length; i++) distance[i] = mask[i] ? 0 : unreached;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            if (distance[i] === 0) continue;
            let best = distance[i];
            if (x > 0) best = Math.min(best, distance[i - 1] + ORTHOGONAL_STEP);
            if (y > 0) best = Math.min(best, distance[i - width] + ORTHOGONAL_STEP);
            if (x > 0 && y > 0) best = Math.min(best, distance[i - width - 1] + DIAGONAL_STEP);
            if (x < width - 1 && y > 0) best = Math.min(best, distance[i - width + 1] + DIAGONAL_STEP);
            distance[i] = best;
        }
    }

    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const i = y * width + x;
            let best = distance[i];
            if (x < width - 1) best = Math.min(best, distance[i + 1] + ORTHOGONAL_STEP);
            if (y < height - 1) best = Math.min(best, distance[i + width] + ORTHOGONAL_STEP);
            if (x < width - 1 && y < height - 1) best = Math.min(best, distance[i + width + 1] + DIAGONAL_STEP);
            if (x > 0 && y < height - 1) best = Math.min(best, distance[i + width - 1] + DIAGONAL_STEP);
            distance[i] = best;
        }
    }

    for (let i = 0; i < distance.length; i++) distance[i] /= ORTHOGONAL_STEP;
    return distance;
}

function loadImage(source: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load ${source}`));
        image.src = source;
    });
}

export async function buildDistanceField(source: string, cellsAcross = 256): Promise<DistanceField> {
    const image = await loadImage(source);

    const imageWidth = cellsAcross;
    const imageHeight = Math.max(1, Math.round((cellsAcross * image.naturalHeight) / image.naturalWidth));
    const width = imageWidth + PAD_CELLS * 2;
    const height = imageHeight + PAD_CELLS * 2;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context for the distance field");
    ctx.drawImage(image, PAD_CELLS, PAD_CELLS, imageWidth, imageHeight);

    const pixels = ctx.getImageData(0, 0, width, height).data;
    const solid = new Uint8Array(width * height);
    const empty = new Uint8Array(width * height);
    for (let i = 0; i < solid.length; i++) {
        const opaque = pixels[i * 4 + 3] > OPAQUE_ALPHA;
        solid[i] = opaque ? 1 : 0;
        empty[i] = opaque ? 0 : 1;
    }

    const toSolid = chamferDistance(solid, width, height);
    const toEmpty = chamferDistance(empty, width, height);

    const data = new Float32Array(solid.length);
    for (let i = 0; i < data.length; i++) data[i] = solid[i] ? -toEmpty[i] : toSolid[i];

    return { width, height, imageWidth, pad: PAD_CELLS, data };
}

function cellAt(field: DistanceField, x: number, y: number) {
    const cx = Math.min(field.width - 1, Math.max(0, x));
    const cy = Math.min(field.height - 1, Math.max(0, y));
    return field.data[cy * field.width + cx];
}

export function distanceAt(field: DistanceField, x: number, y: number) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;

    const top = cellAt(field, x0, y0) * (1 - fx) + cellAt(field, x0 + 1, y0) * fx;
    const bottom = cellAt(field, x0, y0 + 1) * (1 - fx) + cellAt(field, x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
}

export function gradientAt(field: DistanceField, x: number, y: number) {
    return {
        x: (distanceAt(field, x + 1, y) - distanceAt(field, x - 1, y)) / 2,
        y: (distanceAt(field, x, y + 1) - distanceAt(field, x, y - 1)) / 2,
    };
}