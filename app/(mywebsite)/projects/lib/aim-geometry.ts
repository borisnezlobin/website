export type Point = { x: number; y: number };

const cross = (a: Point, b: Point, p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

/** True when p is inside the triangle abc or on its edge, whichever way round the corners go. */
export function pointInTriangle(p: Point, a: Point, b: Point, c: Point) {
    const ab = cross(a, b, p);
    const bc = cross(b, c, p);
    const ca = cross(c, a, p);
    const hasNegative = ab < 0 || bc < 0 || ca < 0;
    const hasPositive = ab > 0 || bc > 0 || ca > 0;
    return !(hasNegative && hasPositive);
}

/**
 * The menu-aim cone: from where the pointer just was to the near edge of the target, widened by `slack`
 * px at each corner. A pointer still inside it is heading for the target.
 */
export function headingFor(from: Point, to: Point, target: DOMRect, slack: number) {
    const top = { x: target.left - slack, y: target.top - slack };
    const bottom = { x: target.left - slack, y: target.bottom + slack };
    return to.x > from.x && pointInTriangle(to, from, top, bottom);
}
