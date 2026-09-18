import { loadManifest } from "./ink-cloud";

export type BodyFrame = {
    bitmap: ImageBitmap;
    x: number;
    y: number;
    width: number;
    height: number;
};

export type BodyReel = {
    at(): BodyFrame | null;
    showing(): number;
    status(): string;
    show(frame: number): void;
    warm(): void;
    close(): void;
};

type PackFrame = { x: number; y: number; width: number; height: number; blob: Blob };
type Pack = { frames: PackFrame[] };

const PACK_MAGIC = "WBP1";
const PACK_HEADER_BYTES = 16;
const PACK_RECORD_BYTES = 16;

const FRAMES_AHEAD = 4;
const FRAMES_BEHIND = 2;
const WARM_FRAMES = 3;
const DECODES_IN_FLIGHT = 2;
const STORE_CAP = 32;
const HOLD_MS = 2000;
const FETCH_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

export function fetchBody(behavior: string) {
    fetchPack(behavior).catch(() => undefined);
}

export function bodiesAreSupported() {
    return typeof createImageBitmap === "function";
}

const packs = new Map<string, Promise<Pack>>();

function parsePack(buffer: ArrayBuffer): Pack {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
    if (magic !== PACK_MAGIC) throw new Error(`not a body pack (${magic})`);
    const count = view.getUint32(4, true);
    const frames: PackFrame[] = [];
    for (let index = 0; index < count; index += 1) {
        const record = PACK_HEADER_BYTES + index * PACK_RECORD_BYTES;
        const offset = view.getUint32(record, true);
        const length = view.getUint32(record + 4, true);
        frames.push({
            x: view.getUint16(record + 8, true),
            y: view.getUint16(record + 10, true),
            width: view.getUint16(record + 12, true),
            height: view.getUint16(record + 14, true),
            blob: new Blob([new Uint8Array(buffer, offset, length)], { type: "image/webp" }),
        });
    }
    return { frames };
}

function fetchPack(behavior: string): Promise<Pack> {
    let held = packs.get(behavior);
    if (held) return held;
    held = loadManifest()
        .then((manifest) => fetch(`/whales/ink/${manifest.body?.[behavior] ?? `body-${behavior}.pack`}`))
        .then((response) => {
            if (!response.ok) throw new Error(`${response.status} for ${behavior}`);
            return response.arrayBuffer();
        })
        .then(parsePack);
    packs.set(behavior, held);
    held.catch(() => {
        if (packs.get(behavior) === held) packs.delete(behavior);
    });
    return held;
}

const frames = new Map<string, BodyFrame>();
const pending = new Map<string, Promise<BodyFrame | null>>();
const reels = new Set<{ held(): string[] }>();

const keyOf = (behavior: string, frame: number) => `${behavior}/${frame}`;

function touch(key: string) {
    const frame = frames.get(key);
    if (!frame) return null;
    frames.delete(key);
    frames.set(key, frame);
    return frame;
}

function trim() {
    if (frames.size <= STORE_CAP) return;
    const protectedKeys = new Set<string>();
    reels.forEach((reel) => reel.held().forEach((key) => protectedKeys.add(key)));
    for (const [key, frame] of frames) {
        if (frames.size <= STORE_CAP) break;
        if (protectedKeys.has(key)) continue;
        frames.delete(key);
        frame.bitmap.close();
    }
}

function decodeFrame(behavior: string, pack: Pack, index: number): Promise<BodyFrame | null> {
    const key = keyOf(behavior, index);
    const held = frames.get(key);
    if (held) return Promise.resolve(held);
    let job = pending.get(key);
    if (job) return job;
    const source = pack.frames[index];
    job = createImageBitmap(source.blob)
        .then((bitmap) => {
            const frame: BodyFrame = { bitmap, x: source.x, y: source.y, width: source.width, height: source.height };
            pending.delete(key);
            frames.set(key, frame);
            trim();
            return frame;
        })
        .catch(() => {
            pending.delete(key);
            return null;
        });
    pending.set(key, job);
    return job;
}

export function openBody(behavior: string): BodyReel {
    let pack: Pack | null = null;
    let count = 0;
    let wanted = 0;
    let lastShown = -Infinity;
    let inFlight = 0;
    let closed = false;
    let status = "fetching";

    const wrap = (index: number) => ((index % count) + count) % count;

    const reel = {
        held() {
            if (!count || performance.now() - lastShown > HOLD_MS) return [];
            const keys: string[] = [];
            for (let step = -FRAMES_BEHIND; step <= FRAMES_AHEAD; step += 1) keys.push(keyOf(behavior, wrap(wanted + step)));
            return keys;
        },
    };
    reels.add(reel);

    const load = async (attempt: number): Promise<void> => {
        try {
            const loaded = await fetchPack(behavior);
            if (closed) return;
            pack = loaded;
            count = loaded.frames.length;
            status = "ready";
            pump();
        } catch (error) {
            if (closed) return;
            if (attempt >= FETCH_RETRIES) {
                status = `failed: ${String(error)}`;
                return;
            }
            status = `retrying fetch (${attempt + 1})`;
            setTimeout(() => { if (!closed) load(attempt + 1); }, RETRY_DELAY_MS * (attempt + 1));
        }
    };

    const pump = (from = wanted, reach = FRAMES_AHEAD) => {
        if (closed || !pack) return;
        for (let ahead = 0; ahead <= reach && inFlight < DECODES_IN_FLIGHT; ahead += 1) {
            const index = wrap(from + ahead);
            const key = keyOf(behavior, index);
            if (frames.has(key) || pending.has(key)) continue;
            inFlight += 1;
            status = `decoding ${index}`;
            decodeFrame(behavior, pack, index).then((frame) => {
                inFlight -= 1;
                if (closed) return;
                status = frame ? "ready" : `frame ${index} failed to decode`;
                pump();
            });
        }
    };

    const best = () => {
        if (!count) return -1;
        for (let behind = 0; behind <= FRAMES_BEHIND; behind += 1) {
            const index = wrap(wanted - behind);
            if (frames.has(keyOf(behavior, index))) return index;
        }
        return -1;
    };

    load(0);

    return {
        at() {
            const index = best();
            return index < 0 ? null : touch(keyOf(behavior, index));
        },
        showing: best,
        status: () => status,
        show(frame) {
            wanted = count ? wrap(frame) : frame;
            lastShown = performance.now();
            pump();
        },
        warm() {
            lastShown = performance.now();
            pump(0, WARM_FRAMES - 1);
        },
        close() {
            closed = true;
            reels.delete(reel);
        },
    };
}
