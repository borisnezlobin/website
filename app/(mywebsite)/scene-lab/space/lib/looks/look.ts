import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { PolyActor } from "../polyhedron-actor";
import type { WhaleActor } from "../whale-actor";
import type { Zap } from "../zap-director";

export type LookContext = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera };

export type LookFrame = { time: number; dt: number; glitch: number; glitchSeed: number };

/** Everything that makes one direction look the way it does. The world supplies motion; a look supplies pixels. */
export type Look = {
    maxPixelRatio: number;
    dressWhale: (actor: WhaleActor) => void;
    dressPoly: (actor: PolyActor) => void;
    dressZap: (zap: Zap) => void;
    setTheme: (dark: boolean) => void;
    resize: (width: number, height: number, pixelRatio: number) => void;
    render: (frame: LookFrame) => void;
    dispose: () => void;
};

export type LookFactory = (context: LookContext, dark: boolean) => Look;
