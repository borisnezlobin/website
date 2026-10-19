import { AdditiveAnimationBlendMode, LoopOnce, LoopRepeat, type AnimationAction, type AnimationMixer } from "three";
import type { WhaleAsset } from "./whale-asset";
import { pick } from "./random";

const CRUISE = "cruise_loop";
const CRUISE_SECONDS = 4;
/** Every one-shot starts and ends matched to cruise_loop, so a short cross-fade hides no seam. */
const ONE_SHOTS = ["roll_left", "roll_right", "roll_left", "roll_right", "turn_left", "turn_right", "rise", "dive"] as const;
const FADE = 0.45;

export type ClipDirector = {
    update: (dt: number) => void;
    setStartle: (weight: number) => void;
};

/**
 * Cruises for a few tail beats, then slips in a roll, turn, rise or dive at a loop boundary and
 * returns to cruising when it ends.
 */
export function createClipDirector(mixer: AnimationMixer, asset: WhaleAsset, random: () => number): ClipDirector {
    const action = (name: string) => mixer.clipAction(asset.clips.get(name)!);
    const cruise = action(CRUISE).setLoop(LoopRepeat, Infinity);
    cruise.time = random() * CRUISE_SECONDS;
    cruise.play();
    let current: AnimationAction = cruise;
    let timeLeft = CRUISE_SECONDS * (2 + Math.floor(random() * 3)) - cruise.time;

    const startle = mixer.clipAction(asset.additive.get("add_fin_spread")!);
    startle.blendMode = AdditiveAnimationBlendMode;
    startle.setEffectiveWeight(0).play();
    startle.time = startle.getClip().duration;
    startle.paused = true;

    function playOneShot() {
        const next = action(pick(random, ONE_SHOTS)).reset().setLoop(LoopOnce, 1);
        next.clampWhenFinished = true;
        next.play();
        current.crossFadeTo(next, FADE, false);
        current = next;
        timeLeft = next.getClip().duration;
    }

    function returnToCruise() {
        cruise.reset().play();
        current.crossFadeTo(cruise, FADE, false);
        current = cruise;
        timeLeft = CRUISE_SECONDS * (2 + Math.floor(random() * 3));
    }

    return {
        update: (dt) => {
            timeLeft -= dt;
            if (timeLeft > 0) return;
            if (current === cruise) playOneShot();
            else returnToCruise();
        },
        setStartle: (weight) => startle.setEffectiveWeight(weight),
    };
}
