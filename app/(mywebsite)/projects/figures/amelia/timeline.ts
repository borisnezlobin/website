import turnsData from "../../data/amelia-turns.json";

export type Turn = readonly [start: number, end: number, lane: number];

export const LANE_COUNT = turnsData.lanes;
export const TURNS = turnsData.turns as unknown as Turn[];
export const DURATION_DS = TURNS.reduce((latest, turn) => Math.max(latest, turn[1]), 0);
export const DECISECONDS_PER_MINUTE = 600;

export type LaneCoverage = { columns: number; values: Float32Array };

const addTurnOverlap = (coverage: LaneCoverage, turn: Turn, columnToTime: (column: number) => number) => {
    const [start, end, lane] = turn;
    const offset = lane * coverage.columns;
    for (let column = 0; column < coverage.columns; column++) {
        const from = columnToTime(column), to = columnToTime(column + 1);
        if (from >= end) return;
        const overlap = Math.min(end, to) - Math.max(start, from);
        if (overlap > 0) coverage.values[offset + column] += overlap / (to - from);
    }
};

export const buildLaneCoverage = (columns: number, columnToTime: (column: number) => number): LaneCoverage => {
    const coverage = { columns, values: new Float32Array(columns * LANE_COUNT) };
    for (const turn of TURNS) addTurnOverlap(coverage, turn, columnToTime);
    return coverage;
};
