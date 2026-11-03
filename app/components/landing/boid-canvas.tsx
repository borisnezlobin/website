"use client";

import { BIRD_COLORS } from "@/app/(mywebsite)/projects/canopy/boids/draw";
import useWindowSize from "@/app/utils/use-window-size";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { DistanceField, buildDistanceField, distanceAt, gradientAt } from "./distance-field";

type BoidGridType = {
    [key: string]: {
        [key: string]: Boid[]
    }
}

type Obstacle = {
    field: DistanceField;
    x: number;
    y: number;
    width: number;
}


const NUM_BOIDS = 200;
const BOID_SIZE = 7;
const BOID_GRID_CELL_SIZE = 200;

const PERCEPTION_RADIUS = 200;
const AVOIDANCE_RADIUS = 20;

const AVOIDANCE_WEIGHT = 15.0;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.1;

const WALL_MARGIN = 500;
const VERTICAL_WALL_MARGIN = 500;
const WALL_FORCE = 300;
const WHALE_SELECTOR = "img[data-whale-hero]";
const WHALE_SOURCE = "/whale-assets/uptotheright.webp";
const WHALE_MARGIN = 55;
const WHALE_FORCE = 2200;
const WHALE_LOOKAHEAD = 110;
const WHALE_RECHECK_FRAMES = 30;
const MIN_VISIBLE_FRACTION = 0.05;
const TARGET_FRAME_MS = 1000 / 60;
const FRAME_TOLERANCE_MS = 2;

const MAX_SPEED = 400;
const DESIRED_SPEED = 300;
const SPEED_VARIANCE = 10; // (as a percentage)
const NOISE = 5;

const BoidCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boidGrid = useRef<BoidGridType>({});
    const boids = useRef<Boid[]>([]);
    const { resolvedTheme } = useTheme();
    const windowSize = useWindowSize();

    const whale = useRef<Obstacle | null>(null);
    const whaleField = useRef<DistanceField | null>(null);
    const framesSinceWhaleCheck = useRef<number>(WHALE_RECHECK_FRAMES);

    const animationFrameId = useRef<number>(undefined);
    const lastTimestamp = useRef<number>(0);
    const isInViewRef = useRef<boolean>(false);
    const isPageVisibleRef = useRef<boolean>(true);
    const hasFocusRef = useRef<boolean>(true);
    
    const initBoids = (width: number, height: number) => {
        boids.current = [];
        for (let i = 0; i < NUM_BOIDS; i++) {
            const boid = new Boid((Math.random() - 0.5) * width / 3 + width / 2, height * 0.5, i);
            boids.current.push(boid);
        }

        boidGrid.current = {};
        // Initialize grid population without advancing simulation
        boids.current.forEach(boid => boid.update(boidGrid.current!, width, height, 0));
    };

    const shouldAnimate = () => isInViewRef.current && isPageVisibleRef.current && hasFocusRef.current;

    const refreshWhalePosition = (canvas: HTMLCanvasElement) => {
        framesSinceWhaleCheck.current += 1;
        if (framesSinceWhaleCheck.current < WHALE_RECHECK_FRAMES) return;
        framesSinceWhaleCheck.current = 0;
        whale.current = locateWhale(canvas, whaleField.current);
    };

    const drawFrame = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dt: number) => {
        const width = canvas.width;
        const height = canvas.height;

        if (!boids.current.length) {
            initBoids(width, height);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = resolvedTheme === 'dark' ? BIRD_COLORS.dark : BIRD_COLORS.light;

        refreshWhalePosition(canvas);

        boids.current.forEach(boid => {
            boid.update(boidGrid.current!, width, height, dt, whale.current);
            boid.draw(ctx);
        });
    };

    const animate = (timestamp: number) => {
        // If we shouldn't run, stop scheduling frames
        if (!shouldAnimate()) {
            animationFrameId.current = undefined;
            return;
        }

        const sinceLastFrame = lastTimestamp.current ? timestamp - lastTimestamp.current : Infinity;
        if (sinceLastFrame < TARGET_FRAME_MS - FRAME_TOLERANCE_MS) {
            animationFrameId.current = requestAnimationFrame(animate);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const deltaMs = lastTimestamp.current ? sinceLastFrame : TARGET_FRAME_MS;
        const dt = Math.min(deltaMs, 100) / 1000; // seconds, clamped
        lastTimestamp.current = timestamp;

        drawFrame(canvas, ctx, dt);

        animationFrameId.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = windowSize.width;
        canvas.height = windowSize.height;

        initBoids(canvas.width, canvas.height);

        if (!whaleField.current) {
            buildDistanceField(WHALE_SOURCE)
                .then((field) => { whaleField.current = field; })
                .catch(() => { });
        }

        const maybeStart = () => {
            if (shouldAnimate() && animationFrameId.current == null) {
                lastTimestamp.current = 0; // reset dt to avoid large jump
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        const stop = () => {
            if (animationFrameId.current != null) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = undefined;
            }
        };

        // IntersectionObserver to detect visibility in viewport
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                isInViewRef.current = !!entry?.isIntersecting
                    && entry.intersectionRatio >= MIN_VISIBLE_FRACTION;
                if (isInViewRef.current) {
                    maybeStart();
                } else {
                    stop();
                }
            },
            { root: null, threshold: [0, MIN_VISIBLE_FRACTION] }
        );
        observer.observe(canvas);

        // Page visibility and focus/blur
        const onVisibility = () => {
            isPageVisibleRef.current = !document.hidden;
            if (isPageVisibleRef.current) {
                maybeStart();
            } else {
                stop();
            }
        };
        const onFocus = () => {
            hasFocusRef.current = true;
            maybeStart();
        };
        const onBlur = () => {
            hasFocusRef.current = false;
            stop();
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);

        // Start if eligible
        isPageVisibleRef.current = !document.hidden;
        hasFocusRef.current = document.hasFocus();
        // isInViewRef will be updated after first observer callback; attempt start anyway
        maybeStart();

        // Cleanup
        return () => {
            stop();
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowSize.width, windowSize.height, resolvedTheme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-[5]"
        ></canvas>
    );
}

function locateWhale(canvas: HTMLCanvasElement, field: DistanceField | null): Obstacle | null {
    if (!field) return null;
    const image = document.querySelector(WHALE_SELECTOR);
    if (!image) return null;

    const whaleBox = image.getBoundingClientRect();
    if (!whaleBox.width) return null;
    const canvasBox = canvas.getBoundingClientRect();

    return {
        field,
        x: whaleBox.x - canvasBox.x,
        y: whaleBox.y - canvasBox.y,
        width: whaleBox.width,
    };
}

type Approach = { distance: number; fx: number; fy: number };

function probe(whale: Obstacle, x: number, y: number): Approach | null {
    const field = whale.field;
    const cellsPerPixel = field.imageWidth / whale.width;
    const fx = (x - whale.x) * cellsPerPixel + field.pad;
    const fy = (y - whale.y) * cellsPerPixel + field.pad;

    if (fx < 0 || fy < 0 || fx > field.width - 1 || fy > field.height - 1) return null;

    return { distance: distanceAt(field, fx, fy) / cellsPerPixel, fx, fy };
}

function nearerApproach(a: Approach | null, b: Approach | null) {
    if (!a) return b;
    if (!b) return a;
    return a.distance <= b.distance ? a : b;
}

function wallScale(val: number) {
    return val * val;
}

function wallPush(position: number, extent: number, margin: number) {
    let push = 0;
    if (position < margin) {
        push += wallScale(Math.min(1, (margin - position) / margin));
    }
    if (position > extent - margin) {
        push -= wallScale(Math.min(1, (position - (extent - margin)) / margin));
    }
    return push;
}

type FlockSteering = {
    alignX: number;
    alignY: number;
    cohesionX: number;
    cohesionY: number;
    separationX: number;
    separationY: number;
    neighborCount: number;
};

type Heading = { velocitySquared: number; inverseSpeed: number };

class Boid {
    x: number;
    y: number
    vx: number;
    vy: number;
    id: number;
    preferredSpeed: number;

    gridX: number;
    gridY: number;
    
    constructor(x: number, y: number, id: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * MAX_SPEED;
        this.vy = (Math.random() - 0.75) * MAX_SPEED;
        this.id = id;

        this.gridX = 0;
        this.gridY = 0;
        this.preferredSpeed = DESIRED_SPEED * (1 + (Math.random() - 0.5) * SPEED_VARIANCE / 100);
        this.setGridPosition();
    }

    setGridPosition() {
        this.gridX = Math.floor(this.x / BOID_GRID_CELL_SIZE);
        this.gridY = Math.floor(this.y / BOID_GRID_CELL_SIZE);
    }

    update(boidGrid: BoidGridType, gridWidth: number, gridHeight: number, dt: number, whale: Obstacle | null = null) {
        const whalePush = this.avoidWhale(whale);
        const wallPushX = wallPush(this.x, gridWidth, WALL_MARGIN);
        const wallPushY = wallPush(this.y, gridHeight, VERTICAL_WALL_MARGIN);
        const flock = this.readFlock(boidGrid);

        this.vx += flock.separationX * AVOIDANCE_WEIGHT * dt;
        this.vy += flock.separationY * AVOIDANCE_WEIGHT * dt;
        const alignFactor = Math.min(1, 5 / (flock.neighborCount + 0.1));
        this.vx += flock.alignX * ALIGNMENT_WEIGHT * alignFactor * dt;
        this.vy += flock.alignY * ALIGNMENT_WEIGHT * alignFactor * dt;

        this.vx += flock.cohesionX * COHESION_WEIGHT * dt;
        this.vy += flock.cohesionY * COHESION_WEIGHT * dt;

        this.vx += wallPushX * WALL_FORCE * dt;
        this.vy += wallPushY * WALL_FORCE * dt;

        this.vx += whalePush.x * WHALE_FORCE * dt;
        this.vy += whalePush.y * WHALE_FORCE * dt;

        this.vx += (Math.random() - 0.5) * NOISE * dt;
        this.vy += (Math.random() - 0.5) * NOISE * dt;

        this.regulateSpeed();

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.moveToCurrentCell(boidGrid);
    }

    readFlock(boidGrid: BoidGridType): FlockSteering {
        const flock: FlockSteering = {
            alignX: 0, alignY: 0, cohesionX: 0, cohesionY: 0, separationX: 0, separationY: 0, neighborCount: 0,
        };
        const velocitySquared = this.vx * this.vx + this.vy * this.vy;
        const currentSpeed = Math.sqrt(velocitySquared);
        const heading: Heading = { velocitySquared, inverseSpeed: currentSpeed > 0 ? 1 / currentSpeed : 0 };

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (const other of boidGrid[this.gridX + i]?.[this.gridY + j] ?? []) {
                    if (other !== this) this.senseNeighbor(other, heading, flock);
                }
            }
        }

        if (flock.neighborCount > 0) {
            flock.alignX = flock.alignX / flock.neighborCount - this.vx;
            flock.alignY = flock.alignY / flock.neighborCount - this.vy;
            flock.cohesionX = flock.cohesionX / flock.neighborCount - this.x;
            flock.cohesionY = flock.cohesionY / flock.neighborCount - this.y;
        }
        return flock;
    }

    senseNeighbor(other: Boid, heading: Heading, flock: FlockSteering) {
        const toOtherX = other.x - this.x;
        const toOtherY = other.y - this.y;
        const distanceSquared = toOtherX * toOtherX + toOtherY * toOtherY;
        if (distanceSquared >= PERCEPTION_RADIUS * PERCEPTION_RADIUS) return;

        const facingDot = this.vx * toOtherX + this.vy * toOtherY;
        if (facingDot < 0 && facingDot * facingDot > heading.velocitySquared * distanceSquared * 0.5) return;

        flock.alignX += other.vx;
        flock.alignY += other.vy;

        const forwardness = toOtherX * this.vx * heading.inverseSpeed
            + toOtherY * this.vy * heading.inverseSpeed;
        if (forwardness > 0) {
            flock.cohesionX += toOtherX * 0.5;
            flock.cohesionY += toOtherY * 0.5;
        }

        if (distanceSquared > 0 && distanceSquared < AVOIDANCE_RADIUS * AVOIDANCE_RADIUS) {
            const strength = (AVOIDANCE_RADIUS - Math.sqrt(distanceSquared)) / AVOIDANCE_RADIUS;
            flock.separationX -= toOtherX * strength;
            flock.separationY -= toOtherY * strength;
        }

        flock.neighborCount++;
    }

    regulateSpeed() {
        const speed = Math.hypot(this.vx, this.vy);

        const speedError = this.preferredSpeed - speed;
        this.vx += (this.vx / speed) * speedError * 0.05;
        this.vy += (this.vy / speed) * speedError * 0.05;

        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }
    }

    moveToCurrentCell(boidGrid: BoidGridType) {
        const oldCell = boidGrid[this.gridX]?.[this.gridY];
        if (oldCell) {
            const oldIndex = oldCell.indexOf(this);
            if (oldIndex >= 0) oldCell.splice(oldIndex, 1);
        }

        this.setGridPosition();
        if (!boidGrid[this.gridX]) boidGrid[this.gridX] = {};
        if (!boidGrid[this.gridX][this.gridY]) boidGrid[this.gridX][this.gridY] = [];
        boidGrid[this.gridX][this.gridY].push(this);
    }

    avoidWhale(whale: Obstacle | null) {
        if (!whale) return { x: 0, y: 0 };

        const speed = Math.hypot(this.vx, this.vy) || 1;
        const here = probe(whale, this.x, this.y);
        const ahead = probe(
            whale,
            this.x + (this.vx / speed) * WHALE_LOOKAHEAD,
            this.y + (this.vy / speed) * WHALE_LOOKAHEAD,
        );
        const closest = nearerApproach(here, ahead);
        if (!closest || closest.distance > WHALE_MARGIN) return { x: 0, y: 0 };

        const outward = here ?? closest;
        const gradient = gradientAt(whale.field, outward.fx, outward.fy);
        const gradientSize = Math.hypot(gradient.x, gradient.y);
        if (gradientSize === 0) return { x: 0, y: 0 };

        const strength = Math.min(1.5, (WHALE_MARGIN - closest.distance) / WHALE_MARGIN);
        return {
            x: (gradient.x / gradientSize) * strength,
            y: (gradient.y / gradientSize) * strength,
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        const normVelocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const tempVx = this.vx / normVelocity;
        const tempVy = this.vy / normVelocity;
        const leadVertex = {
            x: this.x + BOID_SIZE * tempVx,
            y: this.y + BOID_SIZE * tempVy
        }
        const orthogonalVx = -tempVy;
        const orthogonalVy = tempVx;
        ctx.beginPath();
        ctx.moveTo(leadVertex.x, leadVertex.y);
        ctx.lineTo(this.x - BOID_SIZE * tempVx + BOID_SIZE * orthogonalVx / 2, this.y - BOID_SIZE * tempVy + BOID_SIZE * orthogonalVy / 2);
        ctx.lineTo(this.x - BOID_SIZE * tempVx - BOID_SIZE * orthogonalVx / 2, this.y - BOID_SIZE * tempVy - BOID_SIZE * orthogonalVy / 2);
        ctx.closePath();
        ctx.fill();
    }
}

export default BoidCanvas;