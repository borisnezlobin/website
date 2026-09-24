import type { Prisma } from "@/prisma/awooga/client";
import type { HiringTarget } from "./gate";
import type { JsonCompletion } from "./llm";
import { BANK_VERSION } from "./bank-version";
import { saveRequestRow, type RequestRowData } from "./records";
import { hashIp, normalizeQuery } from "./request-meta";
import type { ResearchRecord } from "./research";
import { findUrl } from "./research";
import type { ProgressEvent, ResumeRequestInput } from "./types";

const PIPELINE_BUDGET_MS = 50_000;

export type LlmCallLog = Omit<JsonCompletion<unknown>, "value"> & { purpose: string };

export type PipelineContext = {
    input: ResumeRequestInput;
    /** Set when the request carries the admin password: the owner regenerating a slug is not rate limited. */
    unlimited: boolean;
    query: string;
    normalizedQuery: string;
    jobUrl: string | null;
    ipHash: string;
    startedAt: number;
    deadline: number;
    emit: (event: ProgressEvent) => void;
    target: HiringTarget | null;
    research: ResearchRecord | null;
    llmCalls: LlmCallLog[];
};

export function createContext(input: ResumeRequestInput, ip: string, emit: PipelineContext["emit"], unlimited = false): PipelineContext {
    const query = typeof input.query === "string" ? input.query.trim() : "";
    const startedAt = Date.now();
    return {
        input,
        unlimited,
        query,
        normalizedQuery: normalizeQuery(query),
        jobUrl: findUrl(query),
        ipHash: hashIp(ip),
        startedAt,
        deadline: startedAt + PIPELINE_BUDGET_MS,
        emit,
        target: null,
        research: null,
        llmCalls: [],
    };
}

export function logLlmCall<T>(context: PipelineContext, purpose: string, completion: JsonCompletion<T>): T {
    const { value, ...log } = completion;
    context.llmCalls.push({ purpose, ...log });
    return value;
}

function toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function baseRowData(context: PipelineContext): RequestRowData {
    const lastCall = context.llmCalls[context.llmCalls.length - 1];
    return {
        query: context.query.slice(0, 2_000),
        normalizedQuery: context.normalizedQuery.slice(0, 2_000),
        jobUrl: context.jobUrl,
        ipHash: context.ipHash,
        company: context.target?.company ?? null,
        focus: context.target?.focus ?? null,
        provider: lastCall?.provider ?? null,
        model: lastCall?.model ?? null,
        latencyMs: Date.now() - context.startedAt,
        bankVersion: BANK_VERSION,
        research: context.research ? toJson(context.research) : undefined,
        status: "FAILED",
    };
}

export type RowOverrides = Partial<Omit<RequestRowData, "plan">> & { plan?: Record<string, unknown> };

export function rowDataFor(context: PipelineContext, overrides: RowOverrides): RequestRowData {
    const { plan, ...rest } = overrides;
    const planJson = plan ? toJson({ ...plan, llmCalls: context.llmCalls }) : toJson({ llmCalls: context.llmCalls });
    return { ...baseRowData(context), plan: planJson, ...rest };
}

export async function recordRequest(context: PipelineContext, overrides: RowOverrides) {
    return saveRequestRow(rowDataFor(context, overrides));
}

async function recordQuietly(context: PipelineContext, overrides: RowOverrides): Promise<void> {
    await recordRequest(context, overrides).catch((error) => console.error("Could not record a resume request", error));
}

export async function recordDecline(context: PipelineContext, reason: string): Promise<void> {
    context.emit({ stage: "declined" });
    await recordQuietly(context, { status: "DECLINED", declineReason: reason.slice(0, 200) });
}

export async function recordFailure(context: PipelineContext, message: string, reason: string): Promise<void> {
    context.emit({ stage: "failed", message });
    await recordQuietly(context, { status: "FAILED", declineReason: reason.slice(0, 500) });
}

/** Stored so the admin log shows every request; `slug` stays on the row that owns the resume. */
export async function recordReuse(context: PipelineContext, slug: string): Promise<void> {
    context.emit({ stage: "done", slug });
    await recordQuietly(context, { status: "GENERATED", plan: { reusedSlug: slug } });
}
