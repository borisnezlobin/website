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
const AVOIDANCE_RADIUS = 20;

// const AVOIDANCE_WEIGHT = 1.0; // works: 0.000005;
// const ALIGNMENT_WEIGHT = -0.1; // works: -0.01;
// const COHESION_WEIGHT = -0.0002; // -0.0001;

const AVOIDANCE_WEIGHT = 1.5;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.05;

const MAX_SPEED = 400;
const DESIRED_SPEED = 150;
const MAX_FORCE = 50;

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
            const boid = new Boid((Math.random() - 0.5) * width / 3 + width / 2, height / 2 + (Math.random() - 0.5) * height / 3, i);
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

class Boid {
    x: number;
    y: number
    vx: number;
    vy: number;
    id: number;

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

                            steeringCohesion.x += other.x;
                            steeringCohesion.y += other.y;

                            // steeringSeparation.x += (this.x - other.x) * weight;
                            // steeringSeparation.y += (this.y - other.y) * weight;

                            if (d < AVOIDANCE_RADIUS && d > 0) {
                                const strength = (AVOIDANCE_RADIUS - d) / AVOIDANCE_RADIUS;

                                const dx = this.x - other.x;
                                const dy = this.y - other.y;
                                const invD = 1 / d;

                                steeringSeparation.x += dx * strength;
                                steeringSeparation.y += dy * strength;
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
        this.vx += steeringAlign.x * ALIGNMENT_WEIGHT * dt;
        this.vy += steeringAlign.y * ALIGNMENT_WEIGHT * dt;

        this.vx += steeringCohesion.x * COHESION_WEIGHT * dt;
        this.vy += steeringCohesion.y * COHESION_WEIGHT * dt;

        const speed = Math.hypot(this.vx, this.vy);

        const speedError = DESIRED_SPEED - speed;
        this.vx += (this.vx / speed) * speedError * 0.05;
        this.vy += (this.vy / speed) * speedError * 0.05;

        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < 0) this.x += gridWidth;
        if (this.x > gridWidth) this.x -= gridWidth;
        if (this.y < 0) this.y += gridHeight;
        if (this.y > gridHeight) this.y -= gridHeight;

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