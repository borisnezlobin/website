export function smoothstep(edge0: number, edge1: number, x: number) {
    const k = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
}
