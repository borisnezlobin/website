import type { Arbor } from "./arbor/growth";
import type { NodeLocator } from "./arbor/sway";
import type { PerchPose, PerchSite } from "./boids/types";

export type PerchCriteria = {
    minWidth: number;
    maxWidth: number;
    /** Steepest branch a bird will sit on, in radians from horizontal. */
    maxTilt: number;
    spacing: number;
    area: { left: number; top: number; right: number; bottom: number };
};

const a = { x: 0, y: 0 };
const b = { x: 0, y: 0 };

function siteOnSegment(arbor: Arbor, from: number, to: number, locate: NodeLocator): PerchSite {
    const halfWidth = (arbor.nodes[from].width + arbor.nodes[to].width) / 4;
    return {
        taken: false,
        locate(out: PerchPose) {
            locate(from, a);
            locate(to, b);
            const leftToRight = b.x >= a.x ? 1 : -1;
            out.angle = Math.atan2((b.y - a.y) * leftToRight, (b.x - a.x) * leftToRight);
            out.x = (a.x + b.x) / 2 + Math.sin(out.angle) * halfWidth;
            out.y = (a.y + b.y) / 2 - Math.cos(out.angle) * halfWidth;
        },
    };
}

function insideArea(x: number, y: number, area: PerchCriteria["area"]) {
    return x > area.left && x < area.right && y > area.top && y < area.bottom;
}

function qualifies(arbor: Arbor, from: number, to: number, criteria: PerchCriteria) {
    const start = arbor.nodes[from];
    const end = arbor.nodes[to];
    if (end.width < criteria.minWidth || end.width > criteria.maxWidth) return false;
    const tilt = Math.atan2(Math.abs(end.y - start.y), Math.abs(end.x - start.x));
    return tilt <= criteria.maxTilt && insideArea(end.x, end.y, criteria.area);
}

/** Places perches on fairly level, reachable stretches of branch, spaced apart. */
export function findPerches(arbor: Arbor, locate: NodeLocator, criteria: PerchCriteria): PerchSite[] {
    const chosen: { x: number; y: number }[] = [];
    const sites: PerchSite[] = [];
    const spacingSquared = criteria.spacing * criteria.spacing;
    for (const branch of arbor.branches) {
        for (let position = 2; position < branch.nodes.length; position += 2) {
            const from = branch.nodes[position - 2];
            const to = branch.nodes[position];
            if (!qualifies(arbor, from, to, criteria)) continue;
            const { x, y } = arbor.nodes[to];
            if (chosen.some((other) => (other.x - x) ** 2 + (other.y - y) ** 2 < spacingSquared)) continue;
            chosen.push({ x, y });
            sites.push(siteOnSegment(arbor, from, to, locate));
        }
    }
    return sites;
}
