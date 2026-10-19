import { between, lerpAngle, type Random } from "../random";
import { restingSpot } from "./landing";
import type { Bird, Point } from "./types";

const LEAN_RATE = 16;
const PECK_LEAN = 0.55;

type Twitch = (bird: Bird, random: Random) => void;

const glance: Twitch = (bird, random) => {
    bird.idle.leanTarget = between(random, -0.2, 0.2);
    bird.idle.relaxIn = between(random, 0.4, 1.4);
};

const peck: Twitch = (bird, random) => {
    bird.idle.leanTarget = PECK_LEAN * bird.facing;
    bird.idle.relaxIn = between(random, 0.12, 0.22);
};

const turnAround: Twitch = (bird) => {
    if (bird.perch?.facing) return;
    bird.facing = bird.facing === 1 ? -1 : 1;
    bird.idle.leanTarget = 0;
};

const TWITCHES: [number, Twitch][] = [
    [0.62, glance],
    [0.88, peck],
    [1, turnAround],
];

function twitch(bird: Bird, random: Random) {
    const roll = random();
    const chosen = TWITCHES.find(([threshold]) => roll <= threshold)?.[1] ?? glance;
    chosen(bird, random);
    bird.idle.nextTwitch = between(random, 0.7, 3.2);
}

const spot: Point = { x: 0, y: 0 };

/** Rides the branch as it sways, with the odd glance, peck or turn. */
export function sit(bird: Bird, random: Random, dt: number) {
    const idle = bird.idle;
    idle.nextTwitch -= dt;
    idle.relaxIn -= dt;
    if (idle.nextTwitch <= 0) twitch(bird, random);
    if (idle.relaxIn <= 0) idle.leanTarget = 0;
    idle.lean += (idle.leanTarget - idle.lean) * Math.min(1, dt * LEAN_RATE);

    const restHeading = restingSpot(bird.perch!, bird.facing, spot);
    bird.heading = lerpAngle(bird.heading, restHeading + idle.lean, Math.min(1, dt * LEAN_RATE));
    bird.stretch = 1;
    bird.x = spot.x;
    bird.y = spot.y;
}

/** Springs up and away from whatever scared it, then rejoins the flock. */
export function takeOff(bird: Bird, random: Random, restless: [number, number]) {
    const awayX = bird.x - bird.threat.x;
    const awayY = bird.y - bird.threat.y;
    const awayLength = Math.hypot(awayX, awayY) || 1;
    const forwardX = Math.cos(bird.heading);
    const launchX = forwardX * 0.7 + (awayX / awayLength) * 1.3 + between(random, -0.3, 0.3);
    const launchY = -1.3 + Math.min(0, awayY / awayLength) * 0.8;
    const length = Math.hypot(launchX, launchY);
    const speed = bird.preferredSpeed * between(random, 0.85, 1.1);
    bird.vx = (launchX / length) * speed;
    bird.vy = (launchY / length) * speed;
    bird.state = "flying";
    if (bird.perch) bird.perch.taken = false;
    bird.perch = null;
    bird.takeoffIn = -1;
    bird.timer = between(random, ...restless);
    bird.stretch = 1;
}
