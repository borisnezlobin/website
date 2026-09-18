import type { InkCloud } from "./ink-cloud";
import { buildNeighbourhood, WIDEST_POOL } from "./ink-neighbour-search";

export { WIDEST_POOL } from "./ink-neighbour-search";

type ClipTables = { behavior: string; clip: ArrayBuffer };

const caches = new WeakMap<InkCloud, (Int16Array | undefined)[]>();
const sent = new WeakSet<InkCloud>();
const cloudsByBehavior = new Map<string, InkCloud>();
let worker: Worker | null | undefined;

function cacheFor(cloud: InkCloud) {
    let cache = caches.get(cloud);
    if (!cache) {
        cache = new Array(cloud.frames);
        caches.set(cloud, cache);
    }
    return cache;
}

function receive({ behavior, clip }: ClipTables) {
    const cloud = cloudsByBehavior.get(behavior);
    if (!cloud) return;
    const cache = cacheFor(cloud);
    const all = new Int16Array(clip);
    const stride = cloud.count * WIDEST_POOL;
    for (let frame = 0; frame < cloud.frames; frame += 1) {
        cache[frame] ??= all.subarray(frame * stride, (frame + 1) * stride);
    }
}

function neighbourWorker() {
    if (worker !== undefined) return worker;
    if (typeof window === "undefined" || typeof Worker === "undefined") {
        worker = null;
        return worker;
    }
    try {
        worker = new Worker(new URL("./ink-neighbours.worker.ts", import.meta.url));
        worker.addEventListener("message", (event: MessageEvent<ClipTables>) => receive(event.data));
        worker.addEventListener("error", () => {
            worker?.terminate();
            worker = null;
        });
    } catch {
        worker = null;
    }
    return worker;
}

export function prepareNeighbourhood(cloud: InkCloud) {
    const remote = neighbourWorker();
    if (!remote || sent.has(cloud)) return;
    sent.add(cloud);
    cloudsByBehavior.set(cloud.behavior, cloud);
    const points = cloud.points.slice();
    remote.postMessage({
        behavior: cloud.behavior,
        count: cloud.count,
        frames: cloud.frames,
        points: points.buffer,
    }, [points.buffer]);
}

export function neighbourhood(cloud: InkCloud, frame: number) {
    const cache = cacheFor(cloud);
    const held = cache[frame];
    if (held) return held;

    prepareNeighbourhood(cloud);
    const built = buildNeighbourhood(cloud, frame);
    cache[frame] = built;
    return built;
}
