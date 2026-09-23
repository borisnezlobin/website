"use client";

import { ArrowClockwiseIcon, FileTextIcon } from "@phosphor-icons/react/dist/ssr";
import { STANDARD_SLUG } from "@/app/lib/resume/types";
import { WORKING_STAGES, stageIndex, stageProgress } from "../lib/stages";
import { resumePath } from "../lib/slug";
import type { GenerationState } from "../lib/use-resume-generation";
import { ActionButton, ActionLink } from "@/app/components/action";
import { PaperSheet, ResumeFrame } from "./resume-frame";
import { SheetTexture } from "./sheet-texture";
import { StageList } from "./stage-list";

type GenerationPanelProps = {
    state: GenerationState;
    request: string;
    onRetry: () => void;
};

function nextStageProgress(state: GenerationState) {
    if (state.phase === "failed") return stageProgress(state.stage, false);
    const next = WORKING_STAGES[stageIndex(state.stage) + 1] ?? null;
    return next ? stageProgress(next, false) : 1;
}

function FailureNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <section role="alert" className="flex flex-col items-start gap-4">
            <p className="text-base [text-wrap:pretty]">{message}</p>
            <ActionButton type="button" onClick={onRetry} icon={<ArrowClockwiseIcon weight="bold" className="size-4" />}>
                Try again
            </ActionButton>
            <ActionLink href={resumePath(STANDARD_SLUG)} icon={<FileTextIcon className="size-4" />}>
                Read the standard resume
            </ActionLink>
        </section>
    );
}

export function GenerationPanel({ state, request, onRetry }: GenerationPanelProps) {
    const finished = state.phase === "done" || state.phase === "declined";
    const progress = stageProgress(state.stage, finished);

    const rail = (
        <>
            <h1 className="line-clamp-5 text-2xl leading-snug [overflow-wrap:anywhere] [text-wrap:balance]" title={request}>
                {request}
            </h1>
            <StageList phase={state.phase} stage={state.stage} detail={state.detail} />
            {state.phase === "failed" && <FailureNotice message={state.failure ?? ""} onRetry={onRetry} />}
        </>
    );

    const sheet = (
        <span className={`block transition-opacity duration-700 ${state.phase === "failed" ? "opacity-40" : ""}`}>
            <PaperSheet surface="blank">
                <SheetTexture progress={progress} nextProgress={finished ? 1 : nextStageProgress(state)} />
            </PaperSheet>
        </span>
    );

    return <ResumeFrame rail={rail} sheet={sheet} />;
}
