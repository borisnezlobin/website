import { between, type Random } from "../random";
import type { Pointer } from "../scene-loop";
import { fly, type Arena } from "./flight";
import { approach, beginApproach, chooseFacing, restingSpot, settle } from "./landing";
import { sit, takeOff } from "./perching";
import { DEFAULT_FLOCK, type Bird, type FlockOptions, type PerchSite, type Point } from "./types";

const DESIRED_SPEED = 300;
const SPEED_VARIANCE = 0.1;
const MIN_APPROACH_DISTANCE = 150;
const PERCH_CANDIDATES = 8;

function makeBird(random: Random, arena: Arena): Bird {
    const angle = between(random, -Math.PI, Math.PI);
    return {
        x: between(random, 0.2, 0.8) * arena.width,
        y: between(random, 0.1, 0.5) * arena.height,
        vx: Math.cos(angle) * DESIRED_SPEED,
        vy: Math.sin(angle) * DESIRED_SPEED,
        heading: angle,
        stretch: 1,
        state: "flying",
        preferredSpeed: DESIRED_SPEED * (1 + (random() - 0.5) * SPEED_VARIANCE),
        perch: null,
        facing: 1,
        timer: 0,
        takeoffIn: -1,
        threat: { x: 0, y: 0 },
        path: { from: { x: 0, y: 0 }, pull: { x: 0, y: 0 }, progress: 0, speed: 0 },
        settleAge: 0,
        settleFrom: 0,
        idle: { lean: 0, leanTarget: 0, nextTwitch: between(random, 0.3, 2), relaxIn: 0 },
    };
}

const spot: Point = { x: 0, y: 0 };

function perchScore(bird: Bird, site: PerchSite, random: Random) {
    restingSpot(site, 1, spot);
    const dx = spot.x - bird.x;
    const dy = spot.y - bird.y;
    const distance = Math.hypot(dx, dy);
    if (distance < MIN_APPROACH_DISTANCE) return -Infinity;
    const ahead = (dx * bird.vx + dy * bird.vy) / (distance * (Math.hypot(bird.vx, bird.vy) || 1));
    return ahead + random() * 0.8 - distance / 1400;
}

function choosePerch(bird: Bird, sites: PerchSite[], random: Random) {
    let best: PerchSite | null = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < PERCH_CANDIDATES; attempt++) {
        const site = sites[Math.floor(random() * sites.length)];
        if (!site || site.taken) continue;
        const score = perchScore(bird, site, random);
        if (score <= bestScore) continue;
        best = site;
        bestScore = score;
    }
    return best;
}

function placeOnPerch(bird: Bird, site: PerchSite, random: Random, options: FlockOptions) {
    site.taken = true;
    bird.perch = site;
    bird.facing = chooseFacing(site, bird.x + between(random, -1, 1));
    bird.heading = restingSpot(site, bird.facing, spot);
    bird.x = spot.x;
    bird.y = spot.y;
    bird.state = "perched";
    bird.timer = between(random, ...options.staySeconds);
}

export function createFlock(random: Random, flockOptions: Partial<FlockOptions> = {}) {
    const options: FlockOptions = { ...DEFAULT_FLOCK, ...flockOptions };
    const arena: Arena = { width: 1, height: 1, floor: options.floor };
    let sites: PerchSite[] = [];
    let birds: Bird[] = [];

    const freeSite = () => sites.find((site) => !site.taken) ?? null;

    const scatterOntoPerches = (share: number) => {
        for (const bird of birds) {
            if (bird.state !== "flying" || random() > share) continue;
            const site = choosePerch(bird, sites, random) ?? freeSite();
            if (site) placeOnPerch(bird, site, random, options);
        }
    };

    const startle = (x: number, y: number, radius = options.startleRadius) => {
        for (const bird of birds) {
            if (bird.state === "flying" || bird.takeoffIn >= 0) continue;
            const distance = Math.hypot(bird.x - x, bird.y - y);
            if (distance > radius) continue;
            bird.threat = { x, y };
            bird.takeoffIn = distance / 900 + random() * 0.07;
        }
    };

    const perchedCount = () => birds.filter((bird) => bird.state !== "flying").length;

    const lookForPerch = (bird: Bird) => {
        if (perchedCount() >= birds.length * options.maxPerchedShare) {
            bird.timer = between(random, 1, 3);
            return;
        }
        const site = choosePerch(bird, sites, random);
        if (site) beginApproach(bird, site);
        else bird.timer = between(random, 0.5, 1.5);
    };

    const leaveTogether = (bird: Bird) => {
        bird.threat = { x: bird.x - Math.cos(bird.heading) * 40, y: bird.y + 30 };
        bird.takeoffIn = 0;
        for (const other of birds) {
            if (other === bird || other.state !== "perched" || random() < 0.45) continue;
            if (Math.hypot(other.x - bird.x, other.y - bird.y) > 110) continue;
            other.threat = bird.threat;
            other.takeoffIn = between(random, 0.05, 0.4);
        }
    };

    const perchedStep = (bird: Bird, dt: number) => {
        sit(bird, random, dt);
        bird.timer -= dt;
        if (bird.timer <= 0 && bird.takeoffIn < 0) leaveTogether(bird);
    };

    const flyingStep = (bird: Bird, flyers: Bird[], pointer: Pointer, dt: number) => {
        fly(bird, flyers, arena, pointer, dt);
        bird.timer -= dt;
        if (bird.timer <= 0 && sites.length) lookForPerch(bird);
    };

    const scareFromPointer = (pointer: Pointer) => {
        if (!pointer.active) return;
        const threatened = birds.some((bird) => bird.state !== "flying" && Math.hypot(bird.x - pointer.x, bird.y - pointer.y) < options.scareRadius);
        if (threatened) startle(pointer.x, pointer.y);
    };

    const countDownTakeoff = (bird: Bird, dt: number) => {
        if (bird.takeoffIn < 0) return false;
        bird.takeoffIn -= dt;
        if (bird.takeoffIn > 0) return false;
        takeOff(bird, random, options.restlessSeconds);
        return true;
    };

    const stepBird = (bird: Bird, flyers: Bird[], pointer: Pointer, dt: number) => {
        if (countDownTakeoff(bird, dt)) return;
        if (bird.state === "flying") flyingStep(bird, flyers, pointer, dt);
        else if (bird.state === "approaching") approach(bird, dt);
        else if (bird.state === "settling") settle(bird, dt);
        else perchedStep(bird, dt);
    };

    const update = (dt: number, pointer: Pointer) => {
        scareFromPointer(pointer);
        const flyers = birds.filter((bird) => bird.state === "flying");
        for (const bird of birds) stepBird(bird, flyers, pointer, dt);
    };

    const setPerches = (nextSites: PerchSite[], width: number, height: number) => {
        arena.width = width;
        arena.height = height;
        sites = nextSites;
        const firstLayout = birds.length === 0;
        if (firstLayout) birds = Array.from({ length: options.count }, () => makeBird(random, arena));
        for (const bird of birds) {
            bird.perch = null;
            bird.state = "flying";
            bird.takeoffIn = -1;
            bird.timer = between(random, ...options.restlessSeconds) * (firstLayout ? 0.5 : 1);
        }
        scatterOntoPerches(options.initiallyPerched);
    };

    const perchEveryone = () => scatterOntoPerches(1);

    return { update, setPerches, startle, perchEveryone, get birds() { return birds; } };
}

export type Flock = ReturnType<typeof createFlock>;
