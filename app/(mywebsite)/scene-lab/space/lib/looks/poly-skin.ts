import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Mesh, type Material } from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { PolyActor } from "../polyhedron-actor";
import type { LineSet } from "../star-geometry";
import { createSegmentLines, type SegmentLines } from "./fat-lines";

export type PolySkin = { sync: () => void; fill: Mesh | null; edges: SegmentLines[] };
export type EdgePass = { set: LineSet; material: LineMaterial };

/** One mesh, one draw group per surface part; `materials` follows SURFACE_PARTS order. */
function fillMesh(actor: PolyActor, materials: Material[]) {
    const geometry = new BufferGeometry();
    const position = new BufferAttribute(actor.positions, 3);
    position.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", position);
    geometry.setAttribute("normal", new BufferAttribute(actor.shape.normals, 3));
    actor.shape.groups.forEach(({ start, count }, materialIndex) => geometry.addGroup(start, count, materialIndex));
    const mesh = new Mesh(geometry, materials);
    mesh.frustumCulled = false;
    actor.root.add(mesh);
    return mesh;
}

/**
 * Draws a star as an optional multi-material fill plus any number of edge passes (for example
 * visible hairlines and hidden dashed ones), all reading the actor's live, possibly broken-apart shape.
 */
export function createPolySkin(actor: PolyActor, materials: Material[] | null, edgePasses: EdgePass[]): PolySkin {
    const mesh = materials ? fillMesh(actor, materials) : null;
    const edges = edgePasses.map(({ set, material }) => {
        const segmentCount = actor.lines[set].length / 6;
        const lines = createSegmentLines(segmentCount, material);
        const write = () => lines.write(actor.lines[set], segmentCount);
        write();
        actor.root.add(lines.object);
        return { lines, write };
    });
    let version = actor.version;

    return {
        fill: mesh,
        edges: edges.map(({ lines }) => lines),
        sync: () => {
            if (actor.version === version) return;
            version = actor.version;
            edges.forEach(({ write }) => write());
            if (mesh) mesh.geometry.getAttribute("position").needsUpdate = true;
        },
    };
}
