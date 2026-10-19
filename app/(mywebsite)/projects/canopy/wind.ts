import { between, lerp, noise1, noise2, smoothstep, type Random } from "./random";

type Gust = { start: number; rise: number; fall: number; strength: number; seed: number };

export type WindOptions = {
    /** Steady lean in radians, positive leans strands to the right. */
    breeze: number;
    /** Slow swell and ease of the breeze, felt by the whole tree at once, in radians. */
    swell: number;
    /** Peak extra lean a gust adds, in radians. */
    gustLean: [number, number];
    /** Seconds a gust takes to build to its peak, and roughly how long it takes to die away. */
    gustRise: [number, number];
    gustFall: [number, number];
    secondsBetweenGusts: [number, number];
    /** Chance a gust is a strong one, and how many times stronger than usual it blows. */
    strongGustChance: number;
    strongGustBoost: [number, number];
    /** Chance a gust is chased by another soon after it, the way gusts often come in pairs, and how soon. */
    followUpChance: number;
    followUpSeconds: [number, number];
    /** Lean of the eddies inside the wind in still air, in radians, and how much stronger they get per radian of gust. */
    eddy: number;
    eddyPerGust: number;
};

export const DEFAULT_WIND: WindOptions = {
    breeze: 0.035,
    swell: 0.025,
    gustLean: [0.1, 0.2],
    gustRise: [0.7, 1.4],
    gustFall: [1.6, 3],
    secondsBetweenGusts: [3.5, 8],
    strongGustChance: 0.18,
    strongGustBoost: [1.5, 2.1],
    followUpChance: 0.3,
    followUpSeconds: [0.7, 1.8],
    eddy: 0.02,
    eddyPerGust: 0.3,
};

/** A gust reaches the far side of the screen this long after the near side, so the tree moves almost as one. */
const GUST_CROSSING_SECONDS = 0.45;
/** How unevenly one gust lands across the tree, as a share of its strength, and the px scale of that unevenness. */
const GUST_PATCHINESS = 0.3;
const GUST_PATCH_PX = 700;
/**
 * Eddies at two sizes. Each drifts downwind at its own speed while it changes shape, so nearby
 * strands can briefly swing against the rest without a visible wave running across the tree.
 */
const EDDIES = [
    { px: 280, drift: 60, morph: 0.3, weight: 1.3 },
    { px: 110, drift: 100, morph: 0.7, weight: 0.7 },
];
const SWELL_TIME_SCALE = 0.09;
/**
 * The weather's mood drifts over about a minute between calm spells (rarer, gentler gusts and a
 * weaker breeze) and blustery ones (frequent, harder gusts), so no stretch of wind repeats the last.
 */
const MOOD_TIME_SCALE = 1 / 45;
const MOOD_GAP = [1.8, 0.55] as const;
const MOOD_STRENGTH = [0.65, 1.3] as const;
const MOOD_BREEZE = [0.5, 1.4] as const;
/** Wood is moved by the wind as a whole; it only feels this share of the eddies. */
const WOOD_EDDY_SHARE = 0.35;

/** Eases in to the peak, then falls away more slowly, flat at the top so the turn is never sharp. */
function gustEnvelope(age: number, gust: Gust) {
    if (age <= 0) return 0;
    if (age < gust.rise) return smoothstep(0, gust.rise, age);
    const past = (age - gust.rise) / gust.fall;
    return Math.exp(-past * past);
}

const gustIsOver = (age: number, gust: Gust) => age > GUST_CROSSING_SECONDS + gust.rise + gust.fall * 3;

/**
 * Wind as a lean angle field. Gusts are shared: each builds and dies over a couple of seconds and
 * reaches the whole tree within half a second, a little unevenly. Eddies ride on top of that,
 * stronger while a gust blows, so the strands mostly move together with local subcurrents.
 */
export function createWind(random: Random, options: WindOptions = DEFAULT_WIND) {
    const gusts: Gust[] = [];
    let width = 1;
    let time = 0;
    let untilNextGust = between(random, 0.8, 2);

    const moodSeed = random() * 100;
    const mood = () => noise1(time * MOOD_TIME_SCALE + moodSeed);

    const gustStrength = () => {
        const boost = random() < options.strongGustChance ? between(random, ...options.strongGustBoost) : 1;
        return between(random, ...options.gustLean) * boost * lerp(...MOOD_STRENGTH, mood());
    };

    const secondsToNextGust = () => {
        if (random() < options.followUpChance) return between(random, ...options.followUpSeconds);
        return between(random, ...options.secondsBetweenGusts) * lerp(...MOOD_GAP, mood());
    };

    const spawnGust = () => {
        gusts.push({
            start: time,
            rise: between(random, ...options.gustRise),
            fall: between(random, ...options.gustFall),
            strength: gustStrength(),
            seed: random() * 100,
        });
        untilNextGust = secondsToNextGust();
    };

    const update = (dt: number) => {
        time += dt;
        untilNextGust -= dt;
        if (untilNextGust <= 0) spawnGust();
        for (let i = gusts.length - 1; i >= 0; i--) {
            if (gustIsOver(time - gusts[i].start, gusts[i])) gusts.splice(i, 1);
        }
    };

    const gustAt = (x: number) => {
        const arrival = (Math.min(Math.max(x, 0), width) / width) * GUST_CROSSING_SECONDS;
        let lean = 0;
        for (const gust of gusts) {
            const patch = 1 + GUST_PATCHINESS * (noise1(x / GUST_PATCH_PX + gust.seed) * 2 - 1);
            lean += gust.strength * patch * gustEnvelope(time - gust.start - arrival, gust);
        }
        return lean;
    };

    const eddyAt = (x: number, gust: number) => {
        let swirl = 0;
        EDDIES.forEach((eddy, layer) => {
            swirl += (noise2((x - time * eddy.drift) / eddy.px, time * eddy.morph + layer * 17) - 0.5) * eddy.weight;
        });
        return swirl * (options.eddy + options.eddyPerGust * gust);
    };

    const sharedLean = () => options.breeze * lerp(...MOOD_BREEZE, mood()) + (noise1(time * SWELL_TIME_SCALE) - 0.5) * 2 * options.swell;

    /** Target lean of a hanging strand rooted near x, in radians from vertical. */
    const lean = (x: number) => {
        const gust = gustAt(x);
        return sharedLean() + gust + eddyAt(x, gust);
    };

    /** The lean wood near x is pushed toward: the same wind with most of the eddies averaged out. */
    const woodLean = (x: number) => {
        const gust = gustAt(x);
        return sharedLean() + gust + eddyAt(x, gust) * WOOD_EDDY_SHARE;
    };

    return {
        update,
        lean,
        woodLean,
        resize(nextWidth: number) {
            width = Math.max(1, nextWidth);
        },
    };
}

export type Wind = ReturnType<typeof createWind>;
