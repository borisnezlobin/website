export type WhaleVisualState = "calm" | "intact" | "hover";

export type WhaleBehaviorPath = {
    seconds: number;
    frameSeconds: number;
    bodyFraction: number;
    frameAspect: number;
    hitInset: [number, number, number, number];
    cycle: [number, number];
    frameOffsets: number[];
    steps: [number, number][];
};

export type WhaleStyleCatalog = {
    mirrored: boolean;
    stateColumns: number;
    behaviors: Record<string, WhaleBehaviorPath>;
};

export function stateColumn(state: WhaleVisualState, columns: number) {
    if (state === "hover") return 1;
    if (state === "intact" && columns > 2) return 2;
    return 0;
}

let catalogRequest: Promise<Record<string, WhaleStyleCatalog>> | null = null;

function loadCatalogs() {
    catalogRequest ??= fetch("/whales/paths.json").then((response) => response.json());
    catalogRequest.catch(() => { catalogRequest = null; });
    return catalogRequest;
}

export async function loadCatalog(style: string): Promise<WhaleStyleCatalog> {
    const catalog = await loadCatalogs();
    const found = catalog[style];
    if (!found) throw new Error(`Missing whale style ${style}`);
    return found;
}

export function frameAt(path: WhaleBehaviorPath, seconds: number) {
    const fraction = seconds / path.seconds;
    let index = path.frameOffsets.length - 1;
    while (index > 0 && path.frameOffsets[index] > fraction) index -= 1;
    return index;
}

function strokeProfile(path: WhaleBehaviorPath) {
    const drift = path.cycle[1] / path.seconds;
    const pushes = new Float64Array(path.steps.length);
    let hardest = 0;
    for (let index = 0; index + 1 < path.steps.length; index += 1) {
        const span = (path.frameOffsets[index + 1] - path.frameOffsets[index]) * path.seconds;
        if (span <= 0) continue;
        pushes[index] = Math.abs((path.steps[index + 1][1] - path.steps[index][1]) / span - drift);
        if (pushes[index] > hardest) hardest = pushes[index];
    }
    pushes[pushes.length - 1] = pushes[Math.max(0, pushes.length - 2)];
    if (hardest > 0) for (let index = 0; index < pushes.length; index += 1) pushes[index] /= hardest;
    return pushes;
}

const strokeProfiles = new Map<WhaleBehaviorPath, Float64Array>();

export function strokePush(path: WhaleBehaviorPath, frame: number) {
    let pushes = strokeProfiles.get(path);
    if (!pushes) {
        pushes = strokeProfile(path);
        strokeProfiles.set(path, pushes);
    }
    return pushes[Math.min(Math.max(frame, 0), pushes.length - 1)];
}

function guessedFluke(
    path: WhaleBehaviorPath,
    body?: [number, number, number, number] | null,
): [number, number] {
    const tail = body ? body[0] : path.hitInset[3] / 100;
    const top = body ? body[1] : path.hitInset[0] / 100;
    const bottom = body ? body[1] + body[3] : 1 - path.hitInset[2] / 100;
    const middle = (top + bottom) / 2;
    const pitch = Math.max(-1, Math.min(1, -path.cycle[1] / 0.3));
    return [tail, middle + (bottom - middle) * pitch];
}

export function flukeOffset(
    path: WhaleBehaviorPath,
    mirrored: boolean,
    measured?: [number, number] | null,
    body?: [number, number, number, number] | null,
) {
    const [x, y] = measured ?? guessedFluke(path, body);
    return { x: mirrored ? 1 - x : x, y };
}
