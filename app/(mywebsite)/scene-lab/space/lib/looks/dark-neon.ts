import { AdditiveBlending, NormalBlending, Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { PolyActor } from "../polyhedron-actor";
import type { WhaleActor } from "../whale-actor";
import { createBattleRoom } from "./battle-room";
import { createComposer, disposeSceneGraph, paintBackground } from "./composer";
import { createDust } from "./dust";
import { createLineMaterials } from "./fat-lines";
import { createFinishPass } from "./finish-pass";
import type { LookFactory } from "./look";
import { createPolySkin, type PolySkin } from "./poly-skin";
import { createStarMaterials, type StarFinish, type StarMaterials } from "./star-materials";
import { createStudio, type StudioLevels } from "./studio";
import { attachWhalePoints, type WhalePointUniforms } from "./whale-points";
import { ZAP_LAYER, ZapGlowPass } from "./zap-glow";
import { createZapSkin, type ZapSkin } from "./zap-skin";

type NeonPalette = {
    background: string;
    body: string;
    accent: string;
    red: string;
    hot: string;
    dust: string;
    grid: string;
    gridOpacity: number;
    zapBoost: number;
    star: StarFinish;
    studio: StudioLevels;
    dark: boolean;
};

/** Warm black at night, warm paper by day; never blue. Glow is warm white and red only. */
const NEON: Record<"dark" | "light", NeonPalette> = {
    dark: {
        background: "#0c0907",
        body: "#f4e6d4",
        accent: "#ff6a4d",
        red: "#ff3a2c",
        hot: "#fff3ea",
        dust: "#e2cfb8",
        grid: "#d9c3a8",
        gridOpacity: 0.16,
        zapBoost: 3,
        star: { panel: "#9e978e", bevel: "#d8d1c7", inset: "#0b0807", ring: "#fff0e0", ringGain: 2.4, light: "#ff3a2c", lightGain: 4, red: "#ff3a2c" },
        studio: { environment: 0.35, key: 1.5, rim: 0.9, fill: 0.15 },
        dark: true,
    },
    light: {
        background: "#efe9e1",
        body: "#2a2420",
        accent: "#CC2A26",
        red: "#CC2A26",
        hot: "#CC2A26",
        dust: "#8f8478",
        grid: "#5d5248",
        gridOpacity: 0.16,
        zapBoost: 1,
        star: { panel: "#d6cfc6", bevel: "#f6f2ec", inset: "#2a231e", ring: "#fffaf3", ringGain: 1, light: "#CC2A26", lightGain: 1, red: "#CC2A26" },
        studio: { environment: 0.85, key: 2, rim: 0.6, fill: 0.5 },
        dark: false,
    },
};

const POINTS_PER_WHALE = 26000;

type NeonWhale = { actor: WhaleActor; uniforms: WhalePointUniforms; setAdditive: (additive: boolean) => void };
type NeonPoly = { actor: PolyActor; skin: PolySkin; finish: StarMaterials };

/** The battle room at night: brushed-metal stars with glowing edge lines, skinned point-cloud whales, red bolts blooming. */
export const darkNeonLook: LookFactory = ({ renderer, scene, camera }, dark) => {
    let palette = dark ? NEON.dark : NEON.light;
    let pixelRatio = 1;
    let zapSkin: ZapSkin | null = null;
    camera.layers.enable(ZAP_LAYER);
    const lines = createLineMaterials();
    const studio = createStudio(renderer, scene);
    const room = createBattleRoom(scene);
    const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.55, 0.3, 1);
    const glow = new ZapGlowPass(scene, camera, { mode: "add", strength: 0.9, drawCore: false, isActive: () => zapSkin?.isLit() ?? false });
    const finish = createFinishPass({ grain: 0.025, chroma: 1.1, scan: 0.06, quantize: 0, vignette: 0.5 });
    const { composer, resize: resizeComposer, dispose: disposeComposer } = createComposer(renderer, scene, camera, [bloom, glow, finish.pass]);
    const dust = createDust(scene, 700, "glow", 4);
    const whales: NeonWhale[] = [];
    const polys: NeonPoly[] = [];

    function paintWhale(whale: NeonWhale) {
        whale.uniforms.uColor.value.set(palette.body);
        whale.uniforms.uAccent.value.set(palette.accent);
        whale.uniforms.uRed.value.set(palette.red);
        whale.uniforms.uGain.value = palette.dark ? 0.22 : 0.5;
        whale.setAdditive(palette.dark);
    }

    function paint() {
        paintBackground(scene, palette.background);
        bloom.enabled = palette.dark;
        glow.configure({ mode: palette.dark ? "add" : "tint", strength: palette.dark ? 0.55 : 2.6 });
        glow.setTint(palette.red);
        studio.setLevels(palette.studio);
        room.setColor(palette.grid, palette.gridOpacity);
        dust.setColor(palette.dust, palette.dark ? 0.7 : 0.5);
        dust.setAdditive(palette.dark);
        finish.setTear(palette.background);
        finish.setDial("uScan", palette.dark ? 0.06 : 0.03);
        finish.setDial("uVignette", palette.dark ? 0.5 : 0.08);
        whales.forEach(paintWhale);
        polys.forEach(({ finish: materials }) => materials.paint(palette.star));
        zapSkin?.setColors(palette.background, palette.red, palette.hot, palette.zapBoost);
    }

    function syncPoly(poly: NeonPoly) {
        poly.skin.sync();
        poly.finish.flash(Math.min(1, poly.actor.reaction.flash * 1.4));
    }

    return {
        maxPixelRatio: 1.75,
        dressWhale: (actor) => {
            const { material, uniforms } = attachWhalePoints(actor.mesh, POINTS_PER_WHALE, whales.length + 3);
            uniforms.uPixelRatio.value = pixelRatio;
            const whale: NeonWhale = {
                actor,
                uniforms,
                setAdditive: (additive) => {
                    material.blending = additive ? AdditiveBlending : NormalBlending;
                    material.needsUpdate = true;
                },
            };
            paintWhale(whale);
            whales.push(whale);
        },
        dressPoly: (actor) => {
            const materials = createStarMaterials(palette.star);
            polys.push({ actor, skin: createPolySkin(actor, materials.materials, []), finish: materials });
        },
        dressZap: (zap) => {
            zapSkin = createZapSkin(
                zap,
                scene,
                [
                    { trunkWidth: 4.5, forkWidth: 2.6, strength: 0.6, level: "glow" },
                    { trunkWidth: 1.8, forkWidth: 1.1, strength: 1.2, level: "core" },
                ],
                (width) => lines.make({ linewidth: width }),
                palette.zapBoost,
            );
            paint();
        },
        setTheme: (nextDark) => {
            palette = nextDark ? NEON.dark : NEON.light;
            paint();
        },
        resize: (width, height, ratio) => {
            pixelRatio = ratio;
            resizeComposer(width, height, ratio);
            lines.resize(width, height);
            dust.setPixelRatio(ratio);
            finish.resize(width * ratio, height * ratio);
            whales.forEach(({ uniforms }) => (uniforms.uPixelRatio.value = ratio));
        },
        render: ({ time, dt, glitch, glitchSeed }) => {
            whales.forEach(({ actor, uniforms }) => {
                actor.mesh.skeleton.update();
                uniforms.uBreak.value = actor.reaction.breakdown;
                uniforms.uSeed.value = actor.reaction.seed;
                uniforms.uFlash.value = Math.min(1, actor.reaction.flash * 1.3);
                uniforms.uTime.value = time;
            });
            polys.forEach(syncPoly);
            zapSkin?.sync();
            dust.frame(time);
            finish.frame(time, glitch, glitchSeed);
            composer.render(dt);
        },
        dispose: () => {
            disposeSceneGraph(scene);
            studio.dispose();
            bloom.dispose();
            glow.dispose();
            disposeComposer();
        },
    };
};
