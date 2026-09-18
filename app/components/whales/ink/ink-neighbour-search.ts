import type { InkCloud } from "./ink-cloud";

export const WIDEST_POOL = 24;

const SEARCH_CELL_SIZE = 96;

export function buildNeighbourhood(cloud: Pick<InkCloud, "count" | "points">, frame: number) {
    const { count, points } = cloud;
    const near = new Int16Array(count * WIDEST_POOL);
    const best = new Float32Array(WIDEST_POOL);
    const who = new Int16Array(WIDEST_POOL);
    const base = frame * count * 2;

    let minCellX = Infinity;
    let minCellY = Infinity;
    let maxCellX = -Infinity;
    let maxCellY = -Infinity;
    for (let i = 0; i < count; i += 1) {
        const cellX = Math.floor(points[base + i * 2] / SEARCH_CELL_SIZE);
        const cellY = Math.floor(points[base + i * 2 + 1] / SEARCH_CELL_SIZE);
        minCellX = Math.min(minCellX, cellX);
        minCellY = Math.min(minCellY, cellY);
        maxCellX = Math.max(maxCellX, cellX);
        maxCellY = Math.max(maxCellY, cellY);
    }

    const columns = maxCellX - minCellX + 1;
    const rows = maxCellY - minCellY + 1;
    const cells: (number[] | undefined)[] = new Array(columns * rows);
    for (let i = 0; i < count; i += 1) {
        const cellX = Math.floor(points[base + i * 2] / SEARCH_CELL_SIZE) - minCellX;
        const cellY = Math.floor(points[base + i * 2 + 1] / SEARCH_CELL_SIZE) - minCellY;
        const cell = cellY * columns + cellX;
        (cells[cell] ??= []).push(i);
    }

    for (let i = 0; i < count; i += 1) {
        const xi = points[base + i * 2];
        const yi = points[base + i * 2 + 1];
        const centerX = Math.floor(xi / SEARCH_CELL_SIZE) - minCellX;
        const centerY = Math.floor(yi / SEARCH_CELL_SIZE) - minCellY;
        let filled = 0;
        let worst = Infinity;

        const consider = (j: number) => {
            if (j === i) return;
            const dx = points[base + j * 2] - xi;
            const dy = points[base + j * 2 + 1] - yi;
            const span = dx * dx + dy * dy;
            if (filled === WIDEST_POOL
                && (span > worst || (span === worst && j >= who[WIDEST_POOL - 1]))) return;
            let slot = Math.min(filled, WIDEST_POOL - 1);
            while (slot > 0 && (best[slot - 1] > span
                || (best[slot - 1] === span && who[slot - 1] > j))) {
                best[slot] = best[slot - 1];
                who[slot] = who[slot - 1];
                slot -= 1;
            }
            best[slot] = span;
            who[slot] = j;
            if (filled < WIDEST_POOL) filled += 1;
            worst = best[filled - 1];
        };

        const visit = (cellX: number, cellY: number) => {
            const members = cells[cellY * columns + cellX];
            if (!members) return;
            for (let member = 0; member < members.length; member += 1) consider(members[member]);
        };

        for (let radius = 0; radius < Math.max(columns, rows); radius += 1) {
            const left = centerX - radius;
            const right = centerX + radius;
            const top = centerY - radius;
            const bottom = centerY + radius;
            const firstX = Math.max(0, left);
            const lastX = Math.min(columns - 1, right);

            if (top >= 0 && top < rows) {
                for (let cellX = firstX; cellX <= lastX; cellX += 1) visit(cellX, top);
            }
            if (bottom !== top && bottom >= 0 && bottom < rows) {
                for (let cellX = firstX; cellX <= lastX; cellX += 1) visit(cellX, bottom);
            }
            const firstSideY = Math.max(0, top + 1);
            const lastSideY = Math.min(rows - 1, bottom - 1);
            if (left >= 0 && left < columns) {
                for (let cellY = firstSideY; cellY <= lastSideY; cellY += 1) visit(left, cellY);
            }
            if (right !== left && right >= 0 && right < columns) {
                for (let cellY = firstSideY; cellY <= lastSideY; cellY += 1) visit(right, cellY);
            }

            if (filled < WIDEST_POOL) continue;
            let nearestUnsearched = Infinity;
            if (left > 0) {
                const boundary = (minCellX + left) * SEARCH_CELL_SIZE;
                nearestUnsearched = Math.min(nearestUnsearched, xi - boundary);
            }
            if (right < columns - 1) {
                const boundary = (minCellX + right + 1) * SEARCH_CELL_SIZE;
                nearestUnsearched = Math.min(nearestUnsearched, boundary - xi);
            }
            if (top > 0) {
                const boundary = (minCellY + top) * SEARCH_CELL_SIZE;
                nearestUnsearched = Math.min(nearestUnsearched, yi - boundary);
            }
            if (bottom < rows - 1) {
                const boundary = (minCellY + bottom + 1) * SEARCH_CELL_SIZE;
                nearestUnsearched = Math.min(nearestUnsearched, boundary - yi);
            }
            if (nearestUnsearched === Infinity || worst < nearestUnsearched * nearestUnsearched) break;
        }
        near.set(who, i * WIDEST_POOL);
    }
    return near;
}
