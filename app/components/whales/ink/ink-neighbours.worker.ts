import { buildNeighbourhood, WIDEST_POOL } from "./ink-neighbour-search";

type Cloud = { behavior: string; count: number; frames: number; points: ArrayBuffer };

function prepare({ behavior, count, frames, points }: Cloud) {
    const cloud = { count, points: new Float32Array(points) };
    const stride = count * WIDEST_POOL;
    const table = new Int16Array(frames * stride);
    for (let frame = 0; frame < frames; frame += 1) {
        table.set(buildNeighbourhood(cloud, frame), frame * stride);
    }
    self.postMessage({ behavior, clip: table.buffer }, { transfer: [table.buffer] });
}

self.addEventListener("message", (event: MessageEvent<Cloud>) => prepare(event.data));
