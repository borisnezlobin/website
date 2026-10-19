import { Color, type Scene } from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { FORK_CAPACITY, TRUNK_CAPACITY } from "../lightning";
import type { Zap } from "../zap-director";
import { createSegmentLines, type SegmentLines } from "./fat-lines";
import { ZAP_LAYER } from "./zap-glow";

/**
 * One stroke of the bolt, widths in CSS pixels. Layers are opaque and fade by tinting from the
 * background toward the bolt colour, because translucent segments double up at every joint and
 * the bolt turns into a string of beads.
 */
export type ZapLayer = { trunkWidth: number; forkWidth: number; strength: number; level: "core" | "glow" };

type BuiltLayer = { spec: ZapLayer; trunk: SegmentLines; forks: SegmentLines; trunkMaterial: LineMaterial; forkMaterial: LineMaterial };

export type ZapSkin = {
    sync: () => void;
    setColors: (background: string, bolt: string, hot?: string, boost?: number) => void;
    isLit: () => boolean;
};

/** `boost` above 1 pushes the bolt past white so a bloom pass catches it. */
export function createZapSkin(zap: Zap, scene: Scene, layers: ZapLayer[], makeMaterial: (width: number) => LineMaterial, initialBoost = 1): ZapSkin {
    let boost = initialBoost;
    let version = -1;
    const background = new Color();
    const bolt = new Color();
    const hot = new Color();
    const built: BuiltLayer[] = layers.map((spec, i) => {
        const trunkMaterial = makeMaterial(spec.trunkWidth);
        const forkMaterial = makeMaterial(spec.forkWidth);
        [trunkMaterial, forkMaterial].forEach((material) => (material.depthWrite = false));
        const trunk = createSegmentLines(TRUNK_CAPACITY, trunkMaterial);
        const forks = createSegmentLines(FORK_CAPACITY, forkMaterial);
        [trunk, forks].forEach((lines) => {
            lines.object.renderOrder = 10 + i;
            lines.object.layers.set(ZAP_LAYER);
            scene.add(lines.object);
        });
        return { spec, trunk, forks, trunkMaterial, forkMaterial };
    });

    function upload() {
        built.forEach(({ trunk, forks }) => {
            trunk.write(zap.shape.trunk, zap.shape.trunkCount);
            forks.write(zap.shape.forks, zap.shape.forkCount);
        });
        version = zap.version;
    }

    function tint(layer: BuiltLayer) {
        const amount = Math.min(1, zap[layer.spec.level] * layer.spec.strength);
        const target = layer.spec.level === "core" && amount > 0.9 ? hot : bolt;
        layer.trunkMaterial.color.copy(background).lerp(target, amount).multiplyScalar(1 + (boost - 1) * amount);
        layer.forkMaterial.color.copy(background).lerp(bolt, amount * 0.9).multiplyScalar(1 + (boost - 1) * amount);
        layer.trunk.object.visible = layer.forks.object.visible = amount > 0.01;
    }

    return {
        sync: () => {
            if (zap.version !== version) upload();
            built.forEach(tint);
        },
        isLit: () => zap.core > 0.001 || zap.glow > 0.001,
        setColors: (backgroundColor, boltColor, hotColor, nextBoost = boost) => {
            boost = nextBoost;
            background.set(backgroundColor);
            bolt.set(boltColor);
            hot.set(hotColor ?? boltColor);
        },
    };
}
