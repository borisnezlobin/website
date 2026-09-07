"use client";

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
    const theme = useTheme();
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

    const animate = (timestamp: number) => {
        // If we shouldn't run, stop scheduling frames
        if (!isInViewRef.current || !isPageVisibleRef.current || !hasFocusRef.current) {
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

        const width = canvas.width;
        const height = canvas.height;

        if (!boids.current.length) {
            initBoids(width, height);
        }

        const deltaMs = lastTimestamp.current ? sinceLastFrame : TARGET_FRAME_MS;
        const dt = Math.min(deltaMs, 100) / 1000; // seconds, clamped
        lastTimestamp.current = timestamp;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = theme.theme === 'dark' ? '#E96457' : '#CC2A26';

        framesSinceWhaleCheck.current += 1;
        if (framesSinceWhaleCheck.current >= WHALE_RECHECK_FRAMES) {
            framesSinceWhaleCheck.current = 0;
            whale.current = locateWhale(canvas, whaleField.current);
        }

        boids.current.forEach(boid => {
            boid.update(boidGrid.current!, width, height, dt, whale.current);
            boid.draw(ctx);
        });

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
            const shouldRun = isInViewRef.current && isPageVisibleRef.current && hasFocusRef.current;
            if (shouldRun && animationFrameId.current == null) {
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
    }, [windowSize.width, windowSize.height, theme.theme]);

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
        let steeringAlignX = 0;
        let steeringAlignY = 0;
        let steeringCohesionX = 0;
        let steeringCohesionY = 0;
        let steeringSeparationX = 0;
        let steeringSeparationY = 0;
        let totalCount = 0;

        const gridX = this.gridX;
        const gridY = this.gridY;
        const velocitySquared = this.vx * this.vx + this.vy * this.vy;
        const currentSpeed = Math.sqrt(velocitySquared);
        const inverseSpeed = currentSpeed > 0 ? 1 / currentSpeed : 0;

        let steeringWallsX = 0;
        let steeringWallsY = 0;
        const steeringWhale = this.avoidWhale(whale);

        if (this.x < WALL_MARGIN) {
            steeringWallsX += wallScale(Math.min(1, (WALL_MARGIN - this.x) / WALL_MARGIN));
        }
        if (this.x > gridWidth - WALL_MARGIN) {
            steeringWallsX -= wallScale(Math.min(1, (this.x - (gridWidth - WALL_MARGIN)) / WALL_MARGIN));
        }
        if (this.y < VERTICAL_WALL_MARGIN) {
            steeringWallsY += wallScale(Math.min(1, (VERTICAL_WALL_MARGIN - this.y) / VERTICAL_WALL_MARGIN));
        }
        if (this.y > gridHeight - VERTICAL_WALL_MARGIN) {
            steeringWallsY -= wallScale(Math.min(1, (this.y - (gridHeight - VERTICAL_WALL_MARGIN)) / VERTICAL_WALL_MARGIN));
        }

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const neighborCellX = gridX + i;
                const neighborCellY = gridY + j;
                if (boidGrid[neighborCellX] && boidGrid[neighborCellX][neighborCellY]) {
                    for (const other of boidGrid[neighborCellX][neighborCellY]) {
                        if (other === this) continue;
                        const toOtherX = other.x - this.x;
                        const toOtherY = other.y - this.y;
                        const distanceSquared = toOtherX * toOtherX + toOtherY * toOtherY;
                        if (distanceSquared < PERCEPTION_RADIUS * PERCEPTION_RADIUS) {
                            const facingDot = this.vx * toOtherX + this.vy * toOtherY;
                            if (facingDot < 0
                                && facingDot * facingDot > velocitySquared * distanceSquared * 0.5) {
                                continue;
                            }
                            steeringAlignX += other.vx;
                            steeringAlignY += other.vy;

                            const forwardness = toOtherX * this.vx * inverseSpeed
                                + toOtherY * this.vy * inverseSpeed;
                            if (forwardness > 0) {
                                steeringCohesionX += toOtherX * 0.5;
                                steeringCohesionY += toOtherY * 0.5;
                            }

                            if (distanceSquared > 0
                                && distanceSquared < AVOIDANCE_RADIUS * AVOIDANCE_RADIUS) {
                                const d = Math.sqrt(distanceSquared);
                                const strength = (AVOIDANCE_RADIUS - d) / AVOIDANCE_RADIUS;
                                steeringSeparationX -= toOtherX * strength;
                                steeringSeparationY -= toOtherY * strength;
                            }

                            totalCount++;
                        }
                    }
                }
            }
        }

        if (totalCount > 0) {
            steeringAlignX = steeringAlignX / totalCount - this.vx;
            steeringAlignY = steeringAlignY / totalCount - this.vy;
            steeringCohesionX = steeringCohesionX / totalCount - this.x;
            steeringCohesionY = steeringCohesionY / totalCount - this.y;
        }

        this.vx += steeringSeparationX * AVOIDANCE_WEIGHT * dt;
        this.vy += steeringSeparationY * AVOIDANCE_WEIGHT * dt;
        const alignFactor = Math.min(1, 5 / (totalCount + 0.1));
        this.vx += steeringAlignX * ALIGNMENT_WEIGHT * alignFactor * dt;
        this.vy += steeringAlignY * ALIGNMENT_WEIGHT * alignFactor * dt;

        this.vx += steeringCohesionX * COHESION_WEIGHT * dt;
        this.vy += steeringCohesionY * COHESION_WEIGHT * dt;

        this.vx += steeringWallsX * WALL_FORCE * dt;
        this.vy += steeringWallsY * WALL_FORCE * dt;

        this.vx += steeringWhale.x * WHALE_FORCE * dt;
        this.vy += steeringWhale.y * WHALE_FORCE * dt;

        this.vx += (Math.random() - 0.5) * NOISE * dt;
        this.vy += (Math.random() - 0.5) * NOISE * dt;

        const speed = Math.hypot(this.vx, this.vy);

        const speedError = this.preferredSpeed - speed;
        this.vx += (this.vx / speed) * speedError * 0.05;
        this.vy += (this.vy / speed) * speedError * 0.05;

        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

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