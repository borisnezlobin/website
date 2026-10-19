import { AnimationClip, AnimationUtils, type Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const WHALE_URL = "/scene-lab/humpback-whale.glb";

export type WhaleAsset = {
    scene: Group;
    clips: Map<string, AnimationClip>;
    /** `add_*` poses converted to additive clips: weight 0..1 is the control input. */
    additive: Map<string, AnimationClip>;
};

let pending: Promise<WhaleAsset> | null = null;

function splitClips(animations: AnimationClip[]) {
    const clips = new Map<string, AnimationClip>();
    const additive = new Map<string, AnimationClip>();
    animations.forEach((clip) => {
        if (!clip.name.startsWith("add_")) return void clips.set(clip.name, clip);
        additive.set(clip.name, AnimationUtils.makeClipAdditive(clip.clone(), 0));
    });
    return { clips, additive };
}

async function load(url: string): Promise<WhaleAsset> {
    const gltf = await new GLTFLoader().loadAsync(url);
    return { scene: gltf.scene, ...splitClips(gltf.animations) };
}

/** One download per page, however many whales are swimming. */
export function loadWhaleAsset(url = WHALE_URL): Promise<WhaleAsset> {
    pending ??= load(url).catch((error: unknown) => {
        pending = null;
        throw error;
    });
    return pending;
}
