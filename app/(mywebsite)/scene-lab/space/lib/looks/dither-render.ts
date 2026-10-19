import { brandPalette, type SpacePalette } from "../palette";
import type { PolyActor } from "../polyhedron-actor";
import type { WhaleActor } from "../whale-actor";
import { createBattleRoom } from "./battle-room";
import { createComposer, disposeSceneGraph, paintBackground } from "./composer";
import { createDitherPass, type DitherTones } from "./dither-pass";
import { TONE_WHALE_FRAGMENT } from "./dither-shaders";
import { createDust } from "./dust";
import { createLineMaterials } from "./fat-lines";
import type { LookFactory } from "./look";
import { createPolySkin, type PolySkin } from "./poly-skin";
import { createStarMaterials, type StarFinish, type StarMaterials } from "./star-materials";
import { createStudio, type StudioLevels } from "./studio";
import { pixelWorld, whaleBodyMaterial, whaleOutlineMaterial, whaleUniforms, type WhaleUniforms } from "./whale-shader";
import { dressSkinnedWhale, syncWhaleReaction } from "./whale-skin";
import { ZapGlowPass } from "./zap-glow";
import { createZapSkin, type ZapSkin } from "./zap-skin";

const OUTLINE_PX = 2.5;

type DitherMood = { tones: DitherTones; star: StarFinish; studio: StudioLevels; grid: number };

const STAR: StarFinish = { panel: "#8a8580", bevel: "#f2efeb", inset: "#120e0c", ring: "#ffffff", ringGain: 1, light: "#ff2a20", lightGain: 1, red: "#ff2a20" };

function moodFor(palette: SpacePalette): DitherMood {
    const tones: DitherTones = palette.dark
        ? { dark: palette.paper, light: palette.ink, red: palette.red, levels: [0.12, 0.8] }
        : { dark: palette.ink, light: palette.paper, red: palette.red, levels: [0.1, 0.9] };
    return { tones, star: STAR, studio: { environment: 0.6, key: 2.2, rim: 0.7, fill: 0.45 }, grid: palette.dark ? 0.22 : 0.3 };
}

type DitherWhale = { actor: WhaleActor; uniforms: WhaleUniforms };
type DitherPoly = { actor: PolyActor; skin: PolySkin; finish: StarMaterials };

/** The scene rendered lit, then crushed to a chunky ordered dither in ink, paper and red; bolts stay solid and glow on top. */
export const ditherRenderLook: LookFactory = ({ renderer, scene, camera }, dark) => {
    let palette = brandPalette(dark);
    let mood = moodFor(palette);
    let zapSkin: ZapSkin | null = null;
    const lines = createLineMaterials();
    const studio = createStudio(renderer, scene);
    const room = createBattleRoom(scene);
    const dither = createDitherPass();
    const glow = new ZapGlowPass(scene, camera, { mode: "tint", strength: 2.4, drawCore: true, isActive: () => zapSkin?.isLit() ?? false });
    const { composer, resize: resizeComposer, dispose: disposeComposer } = createComposer(renderer, scene, camera, [dither.pass, glow]);
    const dust = createDust(scene, 260, "dot", 5);
    const whales: DitherWhale[] = [];
    const polys: DitherPoly[] = [];

    function paintWhale({ uniforms }: DitherWhale) {
        uniforms.uInk.value.set(0x000000);
        uniforms.uRed.value.set(STAR.red);
    }

    function paint() {
        paintBackground(scene, palette.paper);
        dither.setTones(mood.tones);
        glow.configure({ mode: palette.dark ? "add" : "tint", strength: palette.dark ? 0.8 : 2.4 });
        glow.setTint(palette.red);
        studio.setLevels(mood.studio);
        room.setColor(palette.mid, mood.grid);
        dust.setColor(palette.mid, 0.8);
        whales.forEach(paintWhale);
        polys.forEach(({ finish }) => finish.paint(mood.star));
        zapSkin?.setColors(palette.paper, palette.red);
    }

    return {
        maxPixelRatio: 2,
        dressWhale: (actor) => {
            const uniforms = whaleUniforms();
            uniforms.uOutlinePx.value = OUTLINE_PX;
            dressSkinnedWhale(actor, whaleBodyMaterial(TONE_WHALE_FRAGMENT, uniforms), whaleOutlineMaterial(uniforms));
            const whale = { actor, uniforms };
            paintWhale(whale);
            whales.push(whale);
        },
        dressPoly: (actor) => {
            const finish = createStarMaterials(mood.star);
            polys.push({ actor, skin: createPolySkin(actor, finish.materials, []), finish });
        },
        dressZap: (zap) => {
            zapSkin = createZapSkin(
                zap,
                scene,
                [
                    { trunkWidth: 2.4, forkWidth: 1.4, strength: 1.2, level: "core" },
                ],
                (width) => lines.make({ linewidth: width }),
            );
            paint();
        },
        setTheme: (nextDark) => {
            palette = brandPalette(nextDark);
            mood = moodFor(palette);
            paint();
        },
        resize: (width, height, pixelRatio) => {
            resizeComposer(width, height, pixelRatio);
            lines.resize(width, height);
            dust.setPixelRatio(pixelRatio);
            dither.resize(width, height, pixelRatio);
        },
        render: ({ time, dt, glitch, glitchSeed }) => {
            whales.forEach(({ actor, uniforms }) => {
                syncWhaleReaction(uniforms, actor);
                uniforms.uPixelWorld.value = pixelWorld(camera.fov, renderer.domElement.clientHeight || 1);
            });
            polys.forEach(({ actor, skin, finish }) => {
                skin.sync();
                finish.flash(Math.min(1, actor.reaction.flash * 1.4));
            });
            zapSkin?.sync();
            dust.frame(time);
            dither.frame(glitch, glitchSeed);
            composer.render(dt);
        },
        dispose: () => {
            disposeSceneGraph(scene);
            studio.dispose();
            glow.dispose();
            disposeComposer();
        },
    };
};
