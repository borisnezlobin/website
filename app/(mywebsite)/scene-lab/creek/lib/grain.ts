/** A tile of paper grain, multiplied over the day scene and screened over the night scene. */
export function createGrainTile(size = 192, strength = 26) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    for (let k = 0; k < size * size; k++) {
        const fibre = Math.random() < 0.012 ? 2.2 : 1;
        const value = 128 + (Math.random() - 0.5) * strength * fibre;
        image.data.set([value, value, value, 255], k * 4);
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

export function drawGrain(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement, width: number, height: number, dark: boolean) {
    const pattern = ctx.createPattern(tile, "repeat");
    if (!pattern) return;
    ctx.save();
    ctx.globalCompositeOperation = dark ? "soft-light" : "multiply";
    ctx.globalAlpha = dark ? 0.35 : 0.12;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
