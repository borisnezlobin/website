import { Color, HalfFloatType, WebGLRenderTarget, type Material, type Mesh, type Object3D, type PerspectiveCamera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

/** Scene render (multisampled), the look's own passes, then sRGB output. */
export function createComposer(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, passes: Pass[], samples = 4) {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    passes.forEach((pass) => composer.addPass(pass));
    composer.addPass(new OutputPass());
    return {
        composer,
        resize: (width: number, height: number, pixelRatio: number) => {
            composer.setPixelRatio(pixelRatio);
            composer.setSize(width, height);
        },
        dispose: () => composer.dispose(),
    };
}

function disposeMaterial(material: Material | Material[]) {
    (Array.isArray(material) ? material : [material]).forEach((m) => m.dispose());
}

/** Frees every geometry and material hanging off the scene graph. */
export function disposeSceneGraph(root: Object3D) {
    root.traverse((node) => {
        const mesh = node as Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) disposeMaterial(mesh.material);
    });
}

/**
 * Background through `scene.background`, not the renderer's clear colour: a clear colour set while no
 * target is bound is stored sRGB-encoded, and the composer's linear target then gets encoded twice.
 */
export function paintBackground(scene: Scene, color: string) {
    if (scene.background instanceof Color) scene.background.set(color);
    else scene.background = new Color(color);
}
