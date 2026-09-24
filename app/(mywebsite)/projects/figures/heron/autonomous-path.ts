export type Point = readonly [number, number];

export type RoutePiece = { points: Point[]; lengths: number[]; total: number };

export type RouteLeg = { piece: number; fromHeading: number; toHeading: number; step: number; shootAfter: boolean };

export const FIELD_INCHES = 144;
export const TILES_PER_SIDE = 6;
export const ROBOT_INCHES = 18;

const START: Point = [118.62, 127.55];
const SHOOT: Point = [80, 80];
const SPIKE_TWO_CONTROL: Point = [82.18, 70.44];
const SPIKE_TWO_CONTROL_1: Point = [105.66, 64.7];
const SPIKE_TWO: Point = [117.4, 58.7];
const GATE_CONTROL: Point = [90, 58];
const GATE_CONTROL_1: Point = [111, 47.3];
const GATE_INTAKE: Point = [129.7, 57.8];
const SPIKE_ONE: Point = [107.4, 84.18];
const LEAVE: Point = [82.18, 105.66];

export const START_HEADING = 225;
const SHOOT_HEADING = 295;
const SPIKE_TWO_HEADING = -15;
const GATE_HEADING = 30;
const SPIKE_ONE_HEADING = 0;

export const WAYPOINTS: Point[] = [START, SHOOT, SPIKE_TWO, GATE_INTAKE, SPIKE_ONE, LEAVE];
const GATE_CYCLE_COUNT = 4;

export const STEP_NAMES = [
    "Start", "Shoot preload", "Spike 2", "Shoot",
    "Gate cycle 1", "Gate cycle 2", "Gate cycle 3", "Gate cycle 4",
    "Spike 1", "Leave and shoot",
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

const polyline = (...points: Point[]) => measured(points);

const cubic = (a: Point, b: Point, c: Point, d: Point) =>
    measured(Array.from({ length: CURVE_SAMPLES + 1 }, (_, k) => cubicAt(a, b, c, d, k / CURVE_SAMPLES)));

const START_TO_SHOOT = 0;
const SHOOT_TO_SPIKE_TWO = 1;
const SPIKE_TWO_TO_SHOOT = 2;
const SHOOT_TO_GATE = 3;
const GATE_TO_SHOOT = 4;
const SHOOT_TO_SPIKE_ONE = 5;
const SPIKE_ONE_TO_LEAVE = 6;

export const PIECES: RoutePiece[] = [
    polyline(START, SHOOT),
    polyline(SHOOT, SPIKE_TWO_CONTROL, SPIKE_TWO_CONTROL_1, SPIKE_TWO),
    polyline(SPIKE_TWO, SHOOT),
    cubic(SHOOT, GATE_CONTROL, GATE_CONTROL_1, GATE_INTAKE),
    polyline(GATE_INTAKE, SHOOT),
    polyline(SHOOT, SPIKE_ONE),
    polyline(SPIKE_ONE, LEAVE),
];

const gateCycle = (step: number): RouteLeg[] => [
    { piece: SHOOT_TO_GATE, fromHeading: SHOOT_HEADING, toHeading: GATE_HEADING, step, shootAfter: false },
    { piece: GATE_TO_SHOOT, fromHeading: GATE_HEADING, toHeading: SHOOT_HEADING, step, shootAfter: true },
];

const FIRST_GATE_STEP = 4;

const gateCycles = Array.from({ length: GATE_CYCLE_COUNT }, (_, k) => gateCycle(FIRST_GATE_STEP + k)).flat();
const spikeOneStep = FIRST_GATE_STEP + GATE_CYCLE_COUNT;

export const LEGS: RouteLeg[] = [
    { piece: START_TO_SHOOT, fromHeading: START_HEADING, toHeading: SHOOT_HEADING, step: 1, shootAfter: true },
    { piece: SHOOT_TO_SPIKE_TWO, fromHeading: SHOOT_HEADING, toHeading: SPIKE_TWO_HEADING, step: 2, shootAfter: false },
    { piece: SPIKE_TWO_TO_SHOOT, fromHeading: SPIKE_TWO_HEADING, toHeading: SHOOT_HEADING, step: 3, shootAfter: true },
    ...gateCycles,
    { piece: SHOOT_TO_SPIKE_ONE, fromHeading: SHOOT_HEADING, toHeading: SPIKE_ONE_HEADING, step: spikeOneStep, shootAfter: false },
    { piece: SPIKE_ONE_TO_LEAVE, fromHeading: SPIKE_ONE_HEADING, toHeading: SPIKE_ONE_HEADING, step: spikeOneStep + 1, shootAfter: true },
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
