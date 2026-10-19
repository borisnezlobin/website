import type { FlowProbe } from "./flow-probe";

/**
 * Something that floats on a creek scene and is moved by its water, such as the gallery prints.
 * The scene hands it a fresh probe whenever the water is rebuilt (first frame, resize) and steps
 * it inside its own frame loop, so the floats and the water never drift out of sync.
 */
export type FloatingLayer = {
    attach: (probe: FlowProbe) => void;
    step: (time: number, delta: number) => void;
};

export type FloatingLayerSource = () => FloatingLayer | null;

/** Keeps a scene's floating layer attached to its current probe and steps it each frame. */
export function createFloatingLink(source: FloatingLayerSource | undefined) {
    let attached: FloatingLayer | null = null;
    let attachedProbe: FlowProbe | null = null;
    return {
        step: (probe: FlowProbe, time: number, delta: number) => {
            const layer = source?.() ?? null;
            if (!layer) return;
            if (layer !== attached || probe !== attachedProbe) {
                layer.attach(probe);
                attached = layer;
                attachedProbe = probe;
            }
            layer.step(time, delta);
        },
    };
}
