export type InkCloud = {
    behavior: string;
    frames: number;
    count: number;
    points: Float32Array;
    eye: Float32Array;
    pale: Uint8Array;
    fin: Uint8Array;
    size: [number, number];
    bodyOrigin: [number, number];
};

type Manifest = {
    size: [number, number];
    quantise: number;
    behaviors: Record<string, { frames: number; count: number; fps: number }>;
    underlayOrigin?: [number, number];
    body?: Record<string, string>;
};

const DEFAULT_BODY_ORIGIN: [number, number] = [147, 50];

let manifest: Promise<Manifest> | null = null;

export function loadManifest(): Promise<Manifest> {
    manifest ??= fetch("/whales/ink/ink.json").then((response) => response.json());
    manifest.catch(() => { manifest = null; });
    return manifest;
}

const clouds = new Map<string, Promise<InkCloud>>();

export function loadCloud(behavior: string): Promise<InkCloud> {
    let held = clouds.get(behavior);
    if (held) return held;

    held = (async () => {
        const meta = await loadManifest();
        const { frames, count } = meta.behaviors[behavior];
        const buffer = await fetch(`/whales/ink/${behavior}.bin`)
            .then((response) => response.arrayBuffer());

        let at = 0;
        const rawPoints = new Int16Array(buffer, at, frames * count * 2);
        at += frames * count * 4;
        const rawEye = new Int16Array(buffer, at, frames * 2);
        at += frames * 4;
        const pale = new Uint8Array(buffer, at, count);
        at += count;
        const fin = new Uint8Array(buffer, at, count);

        const points = new Float32Array(rawPoints.length);
        for (let i = 0; i < rawPoints.length; i += 1) points[i] = rawPoints[i] / meta.quantise;
        const eye = new Float32Array(rawEye.length);
        for (let i = 0; i < rawEye.length; i += 1) eye[i] = rawEye[i] / meta.quantise;

        return {
            behavior, frames, count, points, eye, pale, fin,
            size: meta.size,
            bodyOrigin: meta.underlayOrigin ?? DEFAULT_BODY_ORIGIN,
        };
    })();
    clouds.set(behavior, held);
    held.catch(() => {
        if (clouds.get(behavior) === held) clouds.delete(behavior);
    });
    return held;
}
