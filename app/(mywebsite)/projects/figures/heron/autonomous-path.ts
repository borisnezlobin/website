export type Point = readonly [number, number];

export type RoutePiece = { points: Point[]; lengths: number[]; total: number };

export type RouteLeg = { piece: number; fromHeading: number; toHeading: number; step: number; shootAfter: boolean };

export const FIELD_INCHES = 144;
export const TILES_PER_SIDE = 6;
export const ROBOT_INCHES = 18;

const START: Point = [118.62, 127.55];
const SHOOT: Point = [80, 80];
const SPIKE_TWO: Point = [118.02, 59.01];
const GATE_INTAKE: Point = [129.7, 57.8];
const SPIKE_ONE: Point = [105.02, 82.61];
const LEAVE: Point = [82.61, 106.22];

export const START_HEADING = 225;

export const WAYPOINTS: Point[] = [START, SHOOT, SPIKE_TWO, GATE_INTAKE, SPIKE_ONE, LEAVE];
export const SHOOT_POSE = SHOOT;

export const STEP_NAMES = [
    "Start", "Shoot preload", "Spike 2", "Shoot", "Gate cycle 1", "Gate cycle 2", "Gate cycle 3", "Spike 1", "Leave",
];

const CURVE_SAMPLES = 48;

const cubicAt = (a: Point, b: Point, c: Point, d: Point, u: number): Point => {
    const v = 1 - u;
    const k0 = v * v * v, k1 = 3 * v * v * u, k2 = 3 * v * u * u, k3 = u * u * u;
    return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]];
};

const measured = (points: Point[]): RoutePiece => {
    const lengths = [0];
    for (let k = 1; k < points.length; k++) {
        const [x0, y0] = points[k - 1], [x1, y1] = points[k];
        lengths.push(lengths[k - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    return { points, lengths, total: lengths[lengths.length - 1] };
};

const line = (a: Point, b: Point) => measured([a, b]);

const cubic = (a: Point, b: Point, c: Point, d: Point) =>
    measured(Array.from({ length: CURVE_SAMPLES + 1 }, (_, k) => cubicAt(a, b, c, d, k / CURVE_SAMPLES)));

export const PIECES: RoutePiece[] = [
    line(START, SHOOT),
    cubic(SHOOT, [82.61, 70.81], [106.22, 65.01], SPIKE_TWO),
    line(SPIKE_TWO, SHOOT),
    cubic(SHOOT, [90, 58], [111, 47.3], GATE_INTAKE),
    line(GATE_INTAKE, SHOOT),
    line(SHOOT, SPIKE_ONE),
    line(SPIKE_ONE, LEAVE),
];

const gateCycle = (step: number): RouteLeg[] => [
    { piece: 3, fromHeading: 295, toHeading: 30, step, shootAfter: false },
    { piece: 4, fromHeading: 30, toHeading: 295, step, shootAfter: true },
];

export const LEGS: RouteLeg[] = [
    { piece: 0, fromHeading: START_HEADING, toHeading: 315, step: 1, shootAfter: true },
    { piece: 1, fromHeading: 315, toHeading: -15, step: 2, shootAfter: false },
    { piece: 2, fromHeading: -15, toHeading: 295, step: 3, shootAfter: true },
    ...gateCycle(4),
    ...gateCycle(5),
    ...gateCycle(6),
    { piece: 5, fromHeading: 295, toHeading: 0, step: 7, shootAfter: false },
    { piece: 6, fromHeading: 0, toHeading: 0, step: 8, shootAfter: false },
];

export const pointAlong = (piece: RoutePiece, fraction: number): Point => {
    const target = Math.min(1, Math.max(0, fraction)) * piece.total;
    let k = 1;
    while (k < piece.lengths.length - 1 && piece.lengths[k] < target) k++;
    const span = piece.lengths[k] - piece.lengths[k - 1] || 1;
    const u = (target - piece.lengths[k - 1]) / span;
    const [x0, y0] = piece.points[k - 1], [x1, y1] = piece.points[k];
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
};

export const shortestTurn = (fromDegrees: number, toDegrees: number) =>
    ((((toDegrees - fromDegrees) % 360) + 540) % 360) - 180;
