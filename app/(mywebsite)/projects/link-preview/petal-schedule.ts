import type { Point } from "../canopy/boids/types";
import { between, pick, type Random } from "../canopy/random";
import type { Headline, Tile } from "./headline-tiles";
import type { Arrival, Departure, Drift } from "./petal-flight";
import { FLIGHT_SECONDS, HANDOVERS, LANDING_WINDOW, LOOP_SECONDS, PEEL_SECONDS, type Handover } from "./timeline";

/** Petals that fall while a headline holds: this many a loop, spread through it. */
const DRIFTS_PER_LOOP = 22;
/** A falling petal leaves a blossom about this far upwind of where it lands. */
const UPWIND_PX = 80;
const UPWIND_REACH = 110;

export type PetalSchedule = { arrivals: Arrival[]; departures: Departure[]; drifts: Drift[] };

/** A strand blossom that can let a petal go, and where it hangs when the air is still. */
export type BlossomSource = { index: number; rest: Point };

const share = (tile: Tile, headline: Headline) => (tile.x - headline.left) / Math.max(1, headline.right - headline.left);

function chooseBlossom(random: Random, sources: BlossomSource[], tile: Tile) {
    const upwind = tile.x - UPWIND_PX;
    const near = sources.filter((source) => Math.abs(source.rest.x - upwind) < UPWIND_REACH && source.rest.y < tile.y - 30);
    return pick(random, near.length ? near : sources);
}

function arrivalFor(random: Random, tile: Tile, handover: Handover, headline: Headline, source: BlossomSource): Arrival {
    const wave = LANDING_WINDOW[0] + (LANDING_WINDOW[1] - LANDING_WINDOW[0]) * share(tile, headline);
    const land = handover.start + (tile.isPeriod ? LANDING_WINDOW[1] + 0.12 : wave + between(random, 0, 0.12));
    return {
        tile,
        headline: handover.to,
        release: land - between(random, ...FLIGHT_SECONDS),
        land,
        origin: { ...source.rest },
        source: source.index,
        depth: between(random, -160, 220),
        rock: between(random, 0.6, 1.35),
        rockRate: between(random, 4, 9),
        spinTurns: between(random, -0.6, 0.6),
        sway: between(random, 6, 18),
        swayRate: between(random, 5, 9),
        phase: random() * Math.PI * 2,
        radius: between(random, 2.8, 4.2),
    };
}

function departureFor(random: Random, tile: Tile, handover: Handover, headline: Headline): Departure {
    return {
        tile,
        headline: handover.from,
        liftoff: handover.start + PEEL_SECONDS * share(tile, headline) + between(random, 0, 0.08),
        push: between(random, 420, 900),
        lift: between(random, 50, 170),
        depth: random() < 0.3 ? between(random, 250, 420) : between(random, -260, 120),
        rock: between(random, 0.6, 1.35),
        rockRate: between(random, 5, 11),
        spinRate: between(random, -4, 4),
        phase: random() * Math.PI * 2,
        radius: between(random, 2.8, 4.4),
    };
}

function driftsFor(random: Random, sources: BlossomSource[]) {
    return Array.from({ length: DRIFTS_PER_LOOP }, (_, index): Drift => {
        const source = pick(random, sources);
        return {
            release: ((index + random() * 0.8) / DRIFTS_PER_LOOP) * LOOP_SECONDS,
            origin: { ...source.rest },
            source: source.index,
            terminal: between(random, 24, 42),
            swing: between(random, 10, 26),
            swayRate: between(random, 1.1, 2.3),
            phase: random() * Math.PI * 2,
            flipRate: between(random, 1.4, 3.8) * (random() < 0.5 ? -1 : 1),
            radius: between(random, 3.2, 4.6),
        };
    });
}

/** Every petal of the loop, planned up front from one seed so each loop replays the last exactly. */
export function schedulePetals(random: Random, headlines: Headline[], sources: BlossomSource[]): PetalSchedule {
    const arrivals = HANDOVERS.flatMap((handover) => headlines[handover.to].tiles.map((tile) => arrivalFor(random, tile, handover, headlines[handover.to], chooseBlossom(random, sources, tile))));
    const departures = HANDOVERS.flatMap((handover) => headlines[handover.from].tiles.map((tile) => departureFor(random, tile, handover, headlines[handover.from])));
    return { arrivals, departures, drifts: driftsFor(random, sources) };
}
