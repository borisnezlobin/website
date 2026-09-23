"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressEvent, ResumeRequestInput, WorkingStage } from "@/app/lib/resume/types";
import { requestResume } from "./read-progress-stream";

export type GenerationPhase = "idle" | "working" | "done" | "declined" | "failed";

export type GenerationState = {
    phase: GenerationPhase;
    stage: WorkingStage | null;
    detail: string | null;
    failure: string | null;
};

export const IDLE_GENERATION: GenerationState = { phase: "idle", stage: null, detail: null, failure: null };

const STARTING_GENERATION: GenerationState = { phase: "working", stage: "reading", detail: null, failure: null };

function applyEvent(state: GenerationState, event: ProgressEvent): GenerationState {
    switch (event.stage) {
        case "done":
            return { ...state, phase: "done", detail: null };
        case "declined":
            return { ...state, phase: "declined", detail: null };
        case "failed":
            return { ...state, phase: "failed", detail: null, failure: event.message };
        default:
            return { ...state, phase: "working", stage: event.stage, detail: event.detail ?? null };
    }
}

export type GenerationHandlers = {
    onDone: (slug: string) => void;
    onDeclined: () => void;
};

export function useResumeGeneration(handlers: GenerationHandlers) {
    const [state, setState] = useState<GenerationState>(IDLE_GENERATION);
    const handlersRef = useRef(handlers);
    const abortRef = useRef<AbortController | null>(null);
    handlersRef.current = handlers;

    useEffect(() => () => abortRef.current?.abort(), []);

    const finish = useCallback((event: ProgressEvent) => {
        if (event.stage === "done") handlersRef.current.onDone(event.slug);
        if (event.stage === "declined") handlersRef.current.onDeclined();
    }, []);

    const start = useCallback(async (input: ResumeRequestInput) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setState(STARTING_GENERATION);
        for await (const event of requestResume(input, controller.signal)) {
            if (controller.signal.aborted) return;
            setState((previous) => applyEvent(previous, event));
            finish(event);
        }
    }, [finish]);

    return { state, start };
}
