export type SlotPrediction = { index: number; confidence: number };

export type TaglinePrediction =
    | { predicted: false }
    | { predicted: true; role: SlotPrediction | null; like: SlotPrediction | null };

export const NO_PREDICTION: TaglinePrediction = { predicted: false };

export const MIN_TAGLINE_INPUT = 1;
export const MAX_TAGLINE_INPUT = 200;
