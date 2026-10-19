/**
 * Shared pieces of the slice: the inverted box the Writing quote sits in, and the spring that
 * drives the tear there and on the Projects page's "I do stuff."
 */

export type PlateColors = { bg: string; text: string; source: string; line: string; dark: boolean };

/** The plate is the page's opposite: near-black on the light theme, near-white on the dark one. */
export function plateColors(): PlateColors {
    const dark = document.documentElement.classList.contains("dark");
    return {
        dark,
        bg: dark ? "#f5f5f5" : "#1a1714",
        text: dark ? "#3c3c3c" : "#d0d0d0",
        source: dark ? "#707070" : "#949494",
        line: dark ? "#d0d0d0" : "#3c3c3c",
    };
}

const STIFFNESS = 110;
const DAMPING = 10;
const REST = 0.0005;

export type SliceSpring = { value: number; velocity: number };

/** Underdamped on purpose, so the bands overshoot and settle with a little shudder. */
export function stepSlice(spring: SliceSpring, target: number, dt: number): SliceSpring {
    const velocity = spring.velocity + (STIFFNESS * (target - spring.value) - DAMPING * spring.velocity) * dt;
    const value = spring.value + velocity * dt;
    if (Math.abs(target - value) < REST && Math.abs(velocity) < REST) return { value: target, velocity: 0 };
    return { value, velocity };
}
