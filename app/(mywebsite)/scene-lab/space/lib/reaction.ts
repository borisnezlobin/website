import { Vector3 } from "three";

/** How a struck object is behaving right now. Every look reads this; nothing in it is look-specific. */
export type Reaction = {
    flash: number;
    breakdown: number;
    seed: number;
    age: number;
    offset: Vector3;
    velocity: Vector3;
    tilt: Vector3;
    tiltVelocity: Vector3;
};

const NEVER_STRUCK = 99;
const FLASH_DECAY = 5.5;
const RISE = 0.04;
const HOLD = 0.24;
const REFORM = 0.62;
const JOLT_STIFFNESS = 9;
const JOLT_DAMPING = 2.2;

export function createReaction(): Reaction {
    return {
        flash: 0,
        breakdown: 0,
        seed: 0,
        age: NEVER_STRUCK,
        offset: new Vector3(),
        velocity: new Vector3(),
        tilt: new Vector3(),
        tiltVelocity: new Vector3(),
    };
}

/** `direction` is the way the bolt was travelling, so the jolt pushes the object along it. */
export function strike(reaction: Reaction, direction: Vector3, strength: number) {
    reaction.age = 0;
    reaction.flash = 1;
    reaction.seed = Math.random() * 100;
    reaction.velocity.addScaledVector(direction, strength * 3.2);
    reaction.tiltVelocity.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(strength * 3);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Snaps apart almost instantly, shivers while broken, then knits back together. */
export function breakdownEnvelope(age: number): number {
    if (age < RISE) return age / RISE;
    if (age < HOLD) return 0.85 + 0.15 * Math.sin(age * 90);
    if (age < HOLD + REFORM) return 1 - smooth((age - HOLD) / REFORM);
    return 0;
}

function stepSpring(value: Vector3, velocity: Vector3, dt: number) {
    velocity.addScaledVector(value, -JOLT_STIFFNESS * dt).multiplyScalar(Math.exp(-JOLT_DAMPING * dt));
    value.addScaledVector(velocity, dt);
}

export function stepReaction(reaction: Reaction, dt: number) {
    reaction.age += dt;
    reaction.flash *= Math.exp(-FLASH_DECAY * dt);
    reaction.breakdown = breakdownEnvelope(reaction.age);
    stepSpring(reaction.offset, reaction.velocity, dt);
    stepSpring(reaction.tilt, reaction.tiltVelocity, dt);
}
