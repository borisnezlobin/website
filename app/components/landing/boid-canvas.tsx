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
const BOID_GRID_CELL_SIZE = 300;

const PERCEPTION_RADIUS = 200;
const AVOIDANCE_RADIUS = 50;

const AVOIDANCE_WEIGHT = 1.0; // works: 0.000005;
const ALIGNMENT_WEIGHT = 1.0; // works: -0.01;
const COHESION_WEIGHT = 0.1;

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
            const boid = new Boid(Math.random() * width, Math.random() * height, i);
            boids.current.push(boid);
        }

        boidGrid.current = {};
        boids.current.forEach(boid => boid.update(boidGrid.current!, width, height));
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

        const delta = timestamp - lastTimestamp.current;
        lastTimestamp.current = timestamp;

        ctx.clearRect(0, 0, width, height);

        boids.current.forEach(boid => {
            boid.update(boidGrid.current!, width, height);
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
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.75) * 2;
        this.id = id;

        this.gridX = 0;
        this.gridY = 0;
        this.setGridPosition();
    }

    setGridPosition() {
        this.gridX = Math.floor(this.x / BOID_GRID_CELL_SIZE);
        this.gridY = Math.floor(this.y / BOID_GRID_CELL_SIZE);
    }

    update(boidGrid: BoidGridType, gridWidth: number, gridHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x += gridWidth;
        if (this.x > gridWidth) this.x -= gridWidth;
        if (this.y < 0) this.y += gridHeight;
        if (this.y > gridHeight) this.y -= gridHeight;

        const gridX = Math.floor(this.x / BOID_GRID_CELL_SIZE);
        const gridY = Math.floor(this.y / BOID_GRID_CELL_SIZE);

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

        // temporary
        const maxSpeed = 2;
        const maxForce = 0.05;

        let steeringAlign = { x: 0, y: 0 };
        let steeringCohesion = { x: 0, y: 0 };
        let steeringSeparation = { x: 0, y: 0 };
        let totalCount = 0;

        const gridX = Math.floor(this.x / BOID_GRID_CELL_SIZE);
        const gridY = Math.floor(this.y / BOID_GRID_CELL_SIZE);
        const velocityAddition = { x: 0, y: 0 };

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const neighborCellX = gridX + i;
                const neighborCellY = gridY + j;
                if (boidGrid[neighborCellX] && boidGrid[neighborCellX][neighborCellY]) {
                    for (const other of boidGrid[neighborCellX][neighborCellY]) {
                        const d = Math.hypot(this.x - other.x, this.y - other.y);
                        if (other !== this && d < PERCEPTION_RADIUS) {
                            const weight = (PERCEPTION_RADIUS / d);
                            steeringAlign.x += (this.vx - other.vx) * weight;
                            steeringAlign.y += (this.vy - other.vy) * weight;

                            steeringCohesion.x += (this.x - other.x) * weight;
                            steeringCohesion.y += (this.y - other.y) * weight;

                            // steeringSeparation.x += (this.x - other.x) * weight;
                            // steeringSeparation.y += (this.y - other.y) * weight;

                            if (d < AVOIDANCE_RADIUS) {
                                // check if the other boid is in front of this one
                                if (dot({ x: other.x - this.x, y: other.y - this.y }, { x: this.vx, y: this.vy }) > 0.4) {
                                    const avoidanceWeight = (AVOIDANCE_RADIUS / d);
                                    velocityAddition.x += (this.x - other.x) * avoidanceWeight;
                                    velocityAddition.y += (this.y - other.y) * avoidanceWeight;

                                    steeringSeparation.x += (this.x - other.x) * avoidanceWeight;
                                    steeringSeparation.y += (this.y - other.y) * avoidanceWeight;
                                }
                            }

                            totalCount++;
                        }
                    }
                }
            }
        }

        if (this.id == 3) {
            // this.x += velocityAddition.x * AVOIDANCE_WEIGHT;
            // this.y += velocityAddition.y * AVOIDANCE_WEIGHT;
            // this.vx += steeringAlign.x * ALIGNMENT_WEIGHT;
            // this.vy += steeringAlign.y * ALIGNMENT_WEIGHT;

            // this.vx += steeringCohesion.x * COHESION_WEIGHT;
            // this.vy += steeringCohesion.y * COHESION_WEIGHT;

            // this.vx += steeringSeparation.x * AVOIDANCE_WEIGHT;
            // this.vy += steeringSeparation.y * AVOIDANCE_WEIGHT;
        }

        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

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

        if (this.id == 3) {
            // draw the perception radius, steeringAlign, steeringCohesion, steeringSeparation for debugging
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, PERCEPTION_RADIUS, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + steeringAlign.x * ALIGNMENT_WEIGHT, this.y + steeringAlign.y * ALIGNMENT_WEIGHT);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = 'purple';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + steeringCohesion.x * COHESION_WEIGHT, this.y + steeringCohesion.y * COHESION_WEIGHT);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + steeringSeparation.x * AVOIDANCE_WEIGHT, this.y + steeringSeparation.y * AVOIDANCE_WEIGHT);
            ctx.closePath();
            ctx.stroke();

            // draw the full grid based on canvas dimensions
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            const cols = Math.ceil(ctx.canvas.width / BOID_GRID_CELL_SIZE);
            const rows = Math.ceil(ctx.canvas.height / BOID_GRID_CELL_SIZE);
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const cellX = c * BOID_GRID_CELL_SIZE;
                    const cellY = r * BOID_GRID_CELL_SIZE;
                    ctx.strokeRect(cellX, cellY, BOID_GRID_CELL_SIZE, BOID_GRID_CELL_SIZE);
                }
            }

            // optionally highlight populated cells
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            for (const key in boidGrid) {
                for (const subKey in boidGrid[key]) {
                    const cellX = Number(key) * BOID_GRID_CELL_SIZE;
                    const cellY = Number(subKey) * BOID_GRID_CELL_SIZE;
                    ctx.strokeRect(cellX, cellY, BOID_GRID_CELL_SIZE, BOID_GRID_CELL_SIZE);
                }
            }
        }
    }
}

export { BoidCanvas };