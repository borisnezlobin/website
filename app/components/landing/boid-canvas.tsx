"use client";

import useWindowSize from "@/app/utils/use-window-size";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

type BoidGridType = {
    [key: string]: {
        [key: string]: Boid[]
    }
}


const NUM_BOIDS = 200;
const BOID_SIZE = 7;
const BOID_GRID_CELL_SIZE = 200;

const PERCEPTION_RADIUS = 200;
const SOFT_REPULSION_RADIUS = 80;
const AVOIDANCE_RADIUS = 20;

const AVOIDANCE_WEIGHT = 15.0;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.05;
const SOFT_REPULSION_WEIGHT = 0.00;

const WALL_MARGIN = 500;
const VERTICAL_WALL_MARGIN = 500;
const WALL_FORCE = 300;

const MAX_SPEED = 400;
const DESIRED_SPEED = 300;
const SPEED_VARIANCE = 10; // (as a percentage)
const NOISE = 5;

const BoidCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boidGrid = useRef<BoidGridType>();
    const boids = useRef<Boid[]>([]);
    const theme = useTheme();
    const windowSize = useWindowSize();
    
    const animationFrameId = useRef<number>();
    const lastTimestamp = useRef<number>(0);
    
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        if (!boids.current.length) {
            initBoids(width, height);
        }

        const deltaMs = lastTimestamp.current ? (timestamp - lastTimestamp.current) : 16.67;
        const dt = Math.min(deltaMs, 100) / 1000; // seconds, clamped
        lastTimestamp.current = timestamp;

        ctx.clearRect(0, 0, width, height);

        boids.current.forEach(boid => {
            boid.update(boidGrid.current!, width, height, dt);
            boid.draw(ctx, theme.theme === 'dark', boidGrid.current);
        });

        animationFrameId.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = windowSize.width;
        canvas.height = windowSize.height;

        initBoids(canvas.width, canvas.height);
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [windowSize.width, windowSize.height, theme.theme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-0"
        ></canvas>
    );
}

function dot(a: { x: number; y: number }, b: { x: number; y: number }) {
    return a.x * b.x + a.y * b.y;
}

function mag(v: { x: number; y: number }) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function relativeAngle(aPos: { x: number; y: number }, aVel: { x: number; y: number }, bPos: { x: number; y: number }) {
    const toB = { x: bPos.x - aPos.x, y: bPos.y - aPos.y };
    const aVelMag = mag(aVel);
    const toBMag = mag(toB);
    const cosTheta = dot(aVel, toB) / (aVelMag * toBMag);
    return Math.acos(cosTheta); // in radians
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

    update(boidGrid: BoidGridType, gridWidth: number, gridHeight: number, dt: number) {
        let steeringAlign = { x: 0, y: 0 };
        let steeringCohesion = { x: 0, y: 0 };
        let steeringSeparation = { x: 0, y: 0 };
        let totalCount = 0;

        const gridX = Math.floor(this.x / BOID_GRID_CELL_SIZE);
        const gridY = Math.floor(this.y / BOID_GRID_CELL_SIZE);

        let steeringWalls = { x: 0, y: 0 };

        if (this.x < WALL_MARGIN) {
            // steeringWalls.x += (WALL_MARGIN - this.x) / WALL_MARGIN;
            steeringWalls.x += wallScale(Math.min(1, (WALL_MARGIN - this.x) / WALL_MARGIN));
        }
        if (this.x > gridWidth - WALL_MARGIN) {
            // steeringWalls.x -= (this.x - (gridWidth - WALL_MARGIN)) / WALL_MARGIN;
            steeringWalls.x -= wallScale(Math.min(1, (this.x - (gridWidth - WALL_MARGIN)) / WALL_MARGIN));
        }
        if (this.y < VERTICAL_WALL_MARGIN) {
            // steeringWalls.y += (VERTICAL_WALL_MARGIN - this.y) / VERTICAL_WALL_MARGIN;
            steeringWalls.y += wallScale(Math.min(1, (VERTICAL_WALL_MARGIN - this.y) / VERTICAL_WALL_MARGIN));
        }
        if (this.y > gridHeight - VERTICAL_WALL_MARGIN) {
            // steeringWalls.y -= (this.y - (gridHeight - VERTICAL_WALL_MARGIN)) / VERTICAL_WALL_MARGIN;
            steeringWalls.y -= wallScale(Math.min(1, (this.y - (gridHeight - VERTICAL_WALL_MARGIN)) / VERTICAL_WALL_MARGIN));
        }


        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const neighborCellX = gridX + i;
                const neighborCellY = gridY + j;
                if (boidGrid[neighborCellX] && boidGrid[neighborCellX][neighborCellY]) {
                    for (const other of boidGrid[neighborCellX][neighborCellY]) {
                        const d = Math.hypot(this.x - other.x, this.y - other.y);
                        if (other !== this && d < PERCEPTION_RADIUS) {
                            if (relativeAngle({ x: this.x, y: this.y }, { x: this.vx, y: this.vy }, { x: other.x, y: other.y }) > 3 * Math.PI / 4) {
                                continue;
                            }
                            const weight = (PERCEPTION_RADIUS / d);
                            steeringAlign.x += other.vx;
                            steeringAlign.y += other.vy;

                            const cohesionWeight = (PERCEPTION_RADIUS - d) / PERCEPTION_RADIUS;
                            const speed = Math.hypot(this.vx, this.vy);

                            const toOther = { x: other.x - this.x, y: other.y - this.y };
                            const forward = { x: this.vx / speed, y: this.vy / speed };

                            const forwardness = dot(toOther, forward);
                            if (forwardness > 0) {
                                steeringCohesion.x += toOther.x * 0.5;
                                steeringCohesion.y += toOther.y * 0.5;
                            }



                            // steeringSeparation.x += (this.x - other.x) * weight;
                            // steeringSeparation.y += (this.y - other.y) * weight;

                            if (d < AVOIDANCE_RADIUS && d > 0) {
                                const strength = (AVOIDANCE_RADIUS - d) / AVOIDANCE_RADIUS;

                                const dx = this.x - other.x;
                                const dy = this.y - other.y;
                                const invD = 1 / d;

                                steeringSeparation.x += dx * strength;
                                steeringSeparation.y += dy * strength;
                            } else if (d < SOFT_REPULSION_RADIUS && d > AVOIDANCE_RADIUS) {
                                const strength = (SOFT_REPULSION_RADIUS - d) / SOFT_REPULSION_RADIUS;
                                const dx = this.x - other.x;
                                const dy = this.y - other.y;
                                steeringSeparation.x += dx * strength * SOFT_REPULSION_WEIGHT;
                                steeringSeparation.y += dy * strength * SOFT_REPULSION_WEIGHT;
                            }

                            totalCount++;
                        }
                    }
                }
            }
        }

        if (totalCount > 0) {
            steeringAlign.x /= totalCount;
            steeringAlign.y /= totalCount;

            steeringAlign.x -= this.vx;
            steeringAlign.y -= this.vy;

            steeringCohesion.x /= totalCount;
            steeringCohesion.y /= totalCount;

            steeringCohesion.x -= this.x;
            steeringCohesion.y -= this.y;
        }


        this.vx += steeringSeparation.x * AVOIDANCE_WEIGHT * dt;
        this.vy += steeringSeparation.y * AVOIDANCE_WEIGHT * dt;
        const alignFactor = Math.min(1, 5 / (totalCount + 0.1));
        this.vx += steeringAlign.x * ALIGNMENT_WEIGHT * alignFactor * dt;
        this.vy += steeringAlign.y * ALIGNMENT_WEIGHT * alignFactor * dt;


        this.vx += steeringCohesion.x * COHESION_WEIGHT * dt;
        this.vy += steeringCohesion.y * COHESION_WEIGHT * dt;

        this.vx += steeringWalls.x * WALL_FORCE * dt;
        this.vy += steeringWalls.y * WALL_FORCE * dt;

        // now we inject (noise)
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

        // if (this.x < 0) this.x += gridWidth;
        // if (this.x > gridWidth) this.x -= gridWidth;
        // if (this.y < 0) this.y += gridHeight;
        // if (this.y > gridHeight) this.y -= gridHeight;

        for (const key in boidGrid) {
            for (const subKey in boidGrid[key]) {
                const index = boidGrid[key][subKey].indexOf(this);
                if (index > -1) {
                    boidGrid[key][subKey].splice(index, 1);
                }
            }
        }

        if (!boidGrid[gridX]) boidGrid[gridX] = {};
        if (!boidGrid[gridX][gridY]) boidGrid[gridX][gridY] = [];
        boidGrid[gridX][gridY].push(this);

        this.setGridPosition();
    }

    draw(ctx: CanvasRenderingContext2D, isDarkMode: boolean, boidGrid: BoidGridType | undefined) {
        if (boidGrid == undefined) {
            console.error("BoidGrid is undefined");
            return;
        }
        const color = isDarkMode ? '#E96457' : '#CC2A26';


        // draw triangle
        ctx.fillStyle = color;
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

export { BoidCanvas };