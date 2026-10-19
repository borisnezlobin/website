import { Color, GreaterDepth, MeshBasicMaterial } from "three";
import { createBattleRoom } from "./battle-room";
import { createHatchMaterial } from "./ink-hatch";
import { ZAP_LAYER, ZapGlowPass } from "./zap-glow";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { brandPalette, type SpacePalette } from "../palette";
import type { PolyActor } from "../polyhedron-actor";
import type { WhaleActor } from "../whale-actor";
import { createComposer, disposeSceneGraph, paintBackground } from "./composer";
import { createDust } from "./dust";
import { createLineMaterials } from "./fat-lines";
import { createFinishPass } from "./finish-pass";
import { INK_WHALE_FRAGMENT } from "./ink-shaders";
import type { LookFactory } from "./look";
import { createPolySkin, type PolySkin } from "./poly-skin";
import { pixelWorld, whaleBodyMaterial, whaleOutlineMaterial, whaleUniforms, type WhaleUniforms } from "./whale-shader";
import { dressSkinnedWhale, paintWhaleUniforms, syncWhaleReaction } from "./whale-skin";
import { createZapSkin, type ZapSkin } from "./zap-skin";

const OUTLINE_PX = 2.2;
const EDGE_PX = 0.9;
const HIDDEN_PX = 0.7;

type InkPoly = { actor: PolyActor; skin: PolySkin; fill: MeshBasicMaterial; hatch: ReturnType<typeof createHatchMaterial>; light: MeshBasicMaterial; edge: LineMaterial; hidden: LineMaterial };
type InkWhale = { actor: WhaleActor; uniforms: WhaleUniforms };

/** A technical drawing come alive: paper void, hatched whales, hairline hidden-line stars, red bolts with a red halo. */
export const inkVoidLook: LookFactory = ({ renderer, scene, camera }, dark) => {
    let palette: SpacePalette = brandPalette(dark);
    let zapSkin: ZapSkin | null = null;
    camera.layers.enable(ZAP_LAYER);
    const lines = createLineMaterials();
    const room = createBattleRoom(scene);
    const glow = new ZapGlowPass(scene, camera, { mode: "tint", strength: 2.4, drawCore: false, isActive: () => zapSkin?.isLit() ?? false });
    const finish = createFinishPass({ grain: 0.03, chroma: 0, scan: 0, quantize: 0, vignette: 0.1 });
    const { composer, resize: resizeComposer, dispose: disposeComposer } = createComposer(renderer, scene, camera, [glow, finish.pass]);
    const dust = createDust(scene, 200, "cross", 8);
    const whales: InkWhale[] = [];
    const polys: InkPoly[] = [];
    const flashColor = new Color();

    function paintPoly(poly: InkPoly) {
        poly.fill.color.set(palette.paper);
        poly.light.color.set(palette.red);
        poly.hatch.uniforms.uPaper.value.set(palette.paper);
        poly.hatch.uniforms.uInk.value.set(palette.ink);
        poly.hidden.color.set(palette.mid);
    }

    function paint() {
        paintBackground(scene, palette.paper);
        room.setColor(palette.ink, palette.dark ? 0.09 : 0.1);
        glow.configure({ mode: palette.dark ? "add" : "tint", strength: palette.dark ? 0.8 : 2.4 });
        glow.setTint(palette.red);
        dust.setColor(palette.mid, 0.55);
        finish.setTear(palette.paper);
        whales.forEach(({ uniforms }) => paintWhaleUniforms(uniforms, palette));
        polys.forEach(paintPoly);
        zapSkin?.setColors(palette.paper, palette.red);
    }

    function syncPoly(poly: InkPoly) {
        poly.skin.sync();
        const flash = Math.min(1, poly.actor.reaction.flash * 1.4);
        poly.edge.color.set(palette.ink).lerp(flashColor.set(palette.red), flash);
        poly.fill.color.set(palette.paper).lerp(flashColor.set(palette.red), flash * 0.18);
    }

    return {
        maxPixelRatio: 2,
        dressWhale: (actor) => {
            const uniforms = whaleUniforms();
            uniforms.uOutlinePx.value = OUTLINE_PX;
            paintWhaleUniforms(uniforms, palette);
            dressSkinnedWhale(actor, whaleBodyMaterial(INK_WHALE_FRAGMENT, uniforms), whaleOutlineMaterial(uniforms));
            whales.push({ actor, uniforms });
        },
        dressPoly: (actor) => {
            const fill = new MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
            const light = new MeshBasicMaterial();
            const hatch = createHatchMaterial();
            const edge = lines.make({ linewidth: EDGE_PX });
            const hidden = lines.make({ linewidth: HIDDEN_PX, dashed: true, dashSize: 0.06, gapSize: 0.05, depthFunc: GreaterDepth, depthWrite: false, transparent: true, opacity: 0.55 });
            const skin = createPolySkin(actor, [fill, fill, fill, hatch, light], [
                { set: "detail", material: edge },
                { set: "frame", material: hidden },
            ]);
            skin.edges[1].object.computeLineDistances();
            const poly = { actor, skin, fill, hatch, light, edge, hidden };
            paintPoly(poly);
            polys.push(poly);
        },
        dressZap: (zap) => {
            zapSkin = createZapSkin(
                zap,
                scene,
                [
                    { trunkWidth: 2.2, forkWidth: 1.2, strength: 1.2, level: "core" },
                ],
                (width) => lines.make({ linewidth: width }),
            );
            paint();
        },
        setTheme: (nextDark) => {
            palette = brandPalette(nextDark);
            paint();
        },
        resize: (width, height, pixelRatio) => {
            resizeComposer(width, height, pixelRatio);
            lines.resize(width, height);
            dust.setPixelRatio(pixelRatio);
            finish.resize(width * pixelRatio, height * pixelRatio);
        },
        render: ({ time, dt, glitch, glitchSeed }) => {
            whales.forEach(({ actor, uniforms }) => {
                syncWhaleReaction(uniforms, actor);
                uniforms.uPixelWorld.value = pixelWorld(camera.fov, renderer.domElement.clientHeight || 1);
            });
            polys.forEach(syncPoly);
            zapSkin?.sync();
            dust.frame(time);
            finish.frame(time, glitch, glitchSeed);
            composer.render(dt);
        },
        dispose: () => {
            disposeSceneGraph(scene);
            glow.dispose();
            disposeComposer();
        },
    };
};
