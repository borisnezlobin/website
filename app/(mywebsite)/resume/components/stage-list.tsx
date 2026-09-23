import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import type { WorkingStage } from "@/app/lib/resume/types";
import { ALL_FINISHED, STAGE_LABELS, WORKING_STAGES, stageIndex, stageStateAt, type StageState } from "../lib/stages";
import type { GenerationPhase } from "../lib/use-resume-generation";

type StageListProps = {
    phase: GenerationPhase;
    stage: WorkingStage | null;
    detail: string | null;
};

type MarkerKind = StageState | "stalled";

const LABEL_CLASS: Record<MarkerKind, string> = {
    finished: "text-muted dark:text-muted-dark",
    current: "text-light-foreground dark:text-dark-foreground font-bold",
    stalled: "text-light-foreground dark:text-dark-foreground font-bold",
    waiting: "text-muted/60 dark:text-muted-dark/60",
};

const SCREEN_READER_STATE: Record<MarkerKind, string> = {
    finished: "Done: ",
    current: "Working on: ",
    stalled: "Stopped at: ",
    waiting: "Next: ",
};

function StageMarker({ kind }: { kind: MarkerKind }) {
    if (kind === "finished") return <CheckIcon weight="bold" className="size-4 text-muted dark:text-muted-dark" />;
    if (kind === "stalled") return <WarningCircleIcon weight="fill" className="size-5 text-primary" />;
    if (kind === "waiting") return <span className="size-2 rounded-full bg-muted/30 dark:bg-muted-dark/30" />;
    return (
        <span className="relative flex size-3">
            <span className="absolute inset-0 rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
            <span className="relative size-3 rounded-full bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
        </span>
    );
}

function markerKind(index: number, currentIndex: number, phase: GenerationPhase): MarkerKind {
    const state = stageStateAt(index, currentIndex);
    return state === "current" && phase === "failed" ? "stalled" : state;
}

function currentIndexFor(phase: GenerationPhase, stage: WorkingStage | null) {
    return phase === "done" || phase === "declined" ? ALL_FINISHED : stageIndex(stage);
}

export function StageList({ phase, stage, detail }: StageListProps) {
    const currentIndex = currentIndexFor(phase, stage);
    const announcement = stage && phase === "working" ? STAGE_LABELS[stage] : "";

    return (
        <section aria-label="Progress">
            <p aria-live="polite" className="sr-only">{announcement}</p>
            <ol className="flex flex-col gap-4">
                {WORKING_STAGES.map((name, index) => {
                    const kind = markerKind(index, currentIndex, phase);
                    return (
                        <li key={name} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-baseline gap-x-3 !list-none">
                            <span className="flex h-5 translate-y-1 items-center justify-center" aria-hidden="true">
                                <StageMarker kind={kind} />
                            </span>
                            <span className={`text-base transition-colors duration-300 ${LABEL_CLASS[kind]}`}>
                                <span className="sr-only">{SCREEN_READER_STATE[kind]}</span>
                                {STAGE_LABELS[name]}
                            </span>
                            {kind === "current" && detail && (
                                <span className="col-start-2 mt-1 text-sm text-muted dark:text-muted-dark [overflow-wrap:anywhere]">
                                    {detail}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
