import type { WorkingStage } from "@/app/lib/resume/types";

export const WORKING_STAGES: readonly WorkingStage[] = ["reading", "researching", "screening", "choosing", "typesetting"];

export const STAGE_LABELS: Record<WorkingStage, string> = {
    reading: "Reading the request",
    researching: "Looking up the company",
    screening: "Making sure it’s a hiring request",
    choosing: "Choosing the bullets that fit",
    typesetting: "Setting the page",
};

export type StageState = "finished" | "current" | "waiting";

export function stageStateAt(index: number, currentIndex: number): StageState {
    if (index < currentIndex) return "finished";
    if (index === currentIndex) return "current";
    return "waiting";
}

export function stageIndex(stage: WorkingStage | null): number {
    return stage ? WORKING_STAGES.indexOf(stage) : -1;
}

const ALL_FINISHED = WORKING_STAGES.length;

export function stageProgress(stage: WorkingStage | null, finished: boolean): number {
    if (finished) return 1;
    const index = stageIndex(stage);
    return (index + 1) / (ALL_FINISHED + 1);
}

export { ALL_FINISHED };
