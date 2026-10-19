"use client";

import { useState } from "react";

/** Everything shown once stays mounted and the next item mounts early, so a swap is a crossfade and never a blank. */
export function useLayers<Layer extends { key: string }>(wanted: Layer[]) {
    const [layers, setLayers] = useState<Layer[]>(wanted);
    const missing = wanted.filter((layer) => !layers.some((known) => known.key === layer.key));
    if (missing.length > 0) setLayers([...layers, ...missing]);
    return layers;
}
