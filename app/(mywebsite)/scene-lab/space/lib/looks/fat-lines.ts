import type { InterleavedBufferAttribute, InstancedInterleavedBuffer } from "three";
import { LineMaterial, type LineMaterialParameters } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

export type SegmentLines = {
    object: LineSegments2;
    write: (segments: Float32Array, count: number) => void;
};

/** Screen-space thick lines with a fixed capacity, rewritten in place instead of reallocated. */
export function createSegmentLines(capacity: number, material: LineMaterial): SegmentLines {
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(new Float32Array(capacity * 6));
    const start = geometry.getAttribute("instanceStart") as InterleavedBufferAttribute;
    const buffer = start.data as InstancedInterleavedBuffer;
    const object = new LineSegments2(geometry, material);
    object.frustumCulled = false;
    return {
        object,
        write: (segments, count) => {
            buffer.array.set(segments.subarray(0, count * 6));
            buffer.needsUpdate = true;
            geometry.instanceCount = count;
        },
    };
}

/** Tracks every line material so a resize can tell them all the new drawing-buffer size. */
export function createLineMaterials() {
    const materials: LineMaterial[] = [];
    return {
        make: (parameters: LineMaterialParameters) => {
            const material = new LineMaterial({ alphaToCoverage: true, ...parameters });
            materials.push(material);
            return material;
        },
        resize: (width: number, height: number) => materials.forEach((material) => material.resolution.set(width, height)),
        all: materials,
    };
}
