import { SkinnedMesh, type Material } from "three";
import type { SpacePalette } from "../palette";
import type { WhaleActor } from "../whale-actor";
import type { WhaleUniforms } from "./whale-shader";

/** Swaps the whale's material and, when given one, adds an inverted-hull outline bound to the same skeleton. */
export function dressSkinnedWhale(actor: WhaleActor, body: Material, outline?: Material) {
    actor.mesh.material = body;
    if (!outline) return;
    const hull = new SkinnedMesh(actor.mesh.geometry, outline);
    hull.bind(actor.mesh.skeleton, actor.mesh.bindMatrix);
    hull.frustumCulled = false;
    actor.mesh.add(hull);
}

export function syncWhaleReaction(uniforms: WhaleUniforms, actor: WhaleActor) {
    uniforms.uBreak.value = actor.reaction.breakdown;
    uniforms.uSeed.value = actor.reaction.seed;
    uniforms.uFlash.value = Math.min(1, actor.reaction.flash * 1.3);
}

export function paintWhaleUniforms(uniforms: WhaleUniforms, palette: SpacePalette) {
    uniforms.uPaper.value.set(palette.paper);
    uniforms.uInk.value.set(palette.ink);
    uniforms.uRed.value.set(palette.red);
    uniforms.uMid.value.set(palette.mid);
}
