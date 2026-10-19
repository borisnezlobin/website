import type { Bird } from "./types";

/** The home page's boid: tip 7px ahead, base 7px behind and 7px wide. */
export const BOID_SIZE = 7;

export const BIRD_COLORS = { light: "#CC2A26", dark: "#E96457" } as const;

/** A hairline of paper around each bird keeps it legible against ink and blossom. */
export const BIRD_EDGES = { light: "#f5f5f5", dark: "#1a1714" } as const;
const EDGE_WIDTH = 1.5;

export function traceBird(ctx: CanvasRenderingContext2D, bird: Bird) {
    const forwardX = Math.cos(bird.heading);
    const forwardY = Math.sin(bird.heading);
    const reach = BOID_SIZE * bird.stretch;
    const halfBase = BOID_SIZE / 2;
    const baseX = bird.x - forwardX * reach;
    const baseY = bird.y - forwardY * reach;
    ctx.moveTo(bird.x + forwardX * reach, bird.y + forwardY * reach);
    ctx.lineTo(baseX - forwardY * halfBase, baseY + forwardX * halfBase);
    ctx.lineTo(baseX + forwardY * halfBase, baseY - forwardX * halfBase);
    ctx.closePath();
}

export function drawBirds(ctx: CanvasRenderingContext2D, birds: Bird[], color: string, edge: string) {
    ctx.beginPath();
    for (const bird of birds) traceBird(ctx, bird);
    ctx.strokeStyle = edge;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
}
