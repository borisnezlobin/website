export type Point = { x: number; y: number };

/** A spot on the upper surface of a branch and the branch's direction there (pointing right). */
export type PerchPose = { x: number; y: number; angle: number };

export type PerchSite = {
    locate(out: PerchPose): void;
    taken: boolean;
    /** Forces every bird on this site to face one way, for a tidy row. */
    facing?: 1 | -1;
};

export type BirdState = "flying" | "approaching" | "settling" | "perched";

export type Bird = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    heading: number;
    stretch: number;
    state: BirdState;
    preferredSpeed: number;
    perch: PerchSite | null;
    facing: 1 | -1;
    /** Flying: seconds until it looks for a perch. Perched: seconds until it leaves. */
    timer: number;
    takeoffIn: number;
    threat: Point;
    path: { from: Point; pull: Point; progress: number; speed: number };
    settleAge: number;
    settleFrom: number;
    idle: { lean: number; leanTarget: number; nextTwitch: number; relaxIn: number };
};

export type FlockOptions = {
    count: number;
    initiallyPerched: number;
    maxPerchedShare: number;
    restlessSeconds: [number, number];
    staySeconds: [number, number];
    scareRadius: number;
    /** How far a scare spreads through perched birds. */
    startleRadius: number;
    /** Lowest a flying bird should roam, as a share of the height. */
    floor: number;
};

export const DEFAULT_FLOCK: FlockOptions = {
    count: 40,
    initiallyPerched: 0.55,
    maxPerchedShare: 0.8,
    restlessSeconds: [4, 12],
    staySeconds: [9, 26],
    scareRadius: 100,
    startleRadius: 240,
    floor: 0.78,
};
