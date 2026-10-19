import type { Pointer } from "../scene-loop";
import type { Bird } from "./types";

const PERCEPTION_RADIUS = 200;
const AVOIDANCE_RADIUS = 20;
const AVOIDANCE_WEIGHT = 15;
const ALIGNMENT_WEIGHT = 1;
const COHESION_WEIGHT = 0.1;
const WALL_FORCE = 300;
const MAX_SPEED = 400;
const NOISE = 5;
const PREDATOR_RADIUS = 170;
const PREDATOR_FORCE = 1600;

export type Arena = { width: number; height: number; floor: number };

type Steering = { alignX: number; alignY: number; cohesionX: number; cohesionY: number; separationX: number; separationY: number; count: number };

function isBehind(bird: Bird, toX: number, toY: number, distanceSquared: number) {
    const facing = bird.vx * toX + bird.vy * toY;
    const speedSquared = bird.vx * bird.vx + bird.vy * bird.vy;
    return facing < 0 && facing * facing > speedSquared * distanceSquared * 0.5;
}

function addNeighbour(bird: Bird, other: Bird, steering: Steering) {
    const toX = other.x - bird.x;
    const toY = other.y - bird.y;
    const distanceSquared = toX * toX + toY * toY;
    if (distanceSquared >= PERCEPTION_RADIUS * PERCEPTION_RADIUS || isBehind(bird, toX, toY, distanceSquared)) return;
    steering.alignX += other.vx;
    steering.alignY += other.vy;
    if (toX * bird.vx + toY * bird.vy > 0) {
        steering.cohesionX += toX * 0.5;
        steering.cohesionY += toY * 0.5;
    }
    if (distanceSquared > 0 && distanceSquared < AVOIDANCE_RADIUS * AVOIDANCE_RADIUS) {
        const strength = (AVOIDANCE_RADIUS - Math.sqrt(distanceSquared)) / AVOIDANCE_RADIUS;
        steering.separationX -= toX * strength;
        steering.separationY -= toY * strength;
    }
    steering.count++;
}

function gatherSteering(bird: Bird, flyers: Bird[]): Steering {
    const steering: Steering = { alignX: 0, alignY: 0, cohesionX: 0, cohesionY: 0, separationX: 0, separationY: 0, count: 0 };
    for (const other of flyers) if (other !== bird) addNeighbour(bird, other, steering);
    if (steering.count === 0) return steering;
    steering.alignX = steering.alignX / steering.count - bird.vx;
    steering.alignY = steering.alignY / steering.count - bird.vy;
    steering.cohesionX /= steering.count;
    steering.cohesionY /= steering.count;
    return steering;
}

/** Grows past the margin, so a bird that overshoots a wall is turned back hard rather than drifting on. */
const wallPush = (depth: number, margin: number) => {
    const share = Math.min(4, Math.max(0, depth / margin));
    return share * share;
};

function wallSteering(bird: Bird, arena: Arena) {
    const marginX = Math.min(320, arena.width * 0.22);
    const marginY = Math.min(240, arena.height * 0.2);
    const floorY = arena.height * arena.floor;
    return {
        x: wallPush(marginX - bird.x, marginX) - wallPush(bird.x - (arena.width - marginX), marginX),
        y: wallPush(marginY * 0.4 - bird.y, marginY * 0.4) - wallPush(bird.y - (floorY - marginY), marginY),
    };
}

function predatorSteering(bird: Bird, pointer: Pointer) {
    if (!pointer.active) return { x: 0, y: 0 };
    const dx = bird.x - pointer.x;
    const dy = bird.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance > PREDATOR_RADIUS || distance < 0.01) return { x: 0, y: 0 };
    const strength = (1 - distance / PREDATOR_RADIUS) / distance;
    return { x: dx * strength, y: dy * strength };
}

function holdSpeed(bird: Bird) {
    const speed = Math.hypot(bird.vx, bird.vy) || 1;
    const error = bird.preferredSpeed - speed;
    bird.vx += (bird.vx / speed) * error * 0.05;
    bird.vy += (bird.vy / speed) * error * 0.05;
    const capped = Math.hypot(bird.vx, bird.vy);
    if (capped <= MAX_SPEED) return;
    bird.vx = (bird.vx / capped) * MAX_SPEED;
    bird.vy = (bird.vy / capped) * MAX_SPEED;
}

/** The home page's separation / alignment / cohesion, plus walls and the pointer as a hawk. */
export function fly(bird: Bird, flyers: Bird[], arena: Arena, pointer: Pointer, dt: number) {
    const steering = gatherSteering(bird, flyers);
    const walls = wallSteering(bird, arena);
    const predator = predatorSteering(bird, pointer);
    const alignFactor = Math.min(1, 5 / (steering.count + 0.1));

    bird.vx += (steering.separationX * AVOIDANCE_WEIGHT + steering.alignX * ALIGNMENT_WEIGHT * alignFactor + steering.cohesionX * COHESION_WEIGHT) * dt;
    bird.vy += (steering.separationY * AVOIDANCE_WEIGHT + steering.alignY * ALIGNMENT_WEIGHT * alignFactor + steering.cohesionY * COHESION_WEIGHT) * dt;
    bird.vx += (walls.x * WALL_FORCE + predator.x * PREDATOR_FORCE + (Math.random() - 0.5) * NOISE) * dt;
    bird.vy += (walls.y * WALL_FORCE + predator.y * PREDATOR_FORCE + (Math.random() - 0.5) * NOISE) * dt;
    holdSpeed(bird);

    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;
    bird.heading = Math.atan2(bird.vy, bird.vx);
    bird.stretch = 1;
}
