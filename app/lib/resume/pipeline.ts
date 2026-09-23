import { prefilterQuery, screenResearch, screenWithModel, type HiringTarget } from "./gate";
import { scheduleTypesetterWarmup, typesetAndSave } from "./generate";
import {
    createContext,
    logLlmCall,
    recordDecline,
    recordFailure,
    recordReuse,
    type PipelineContext,
} from "./pipeline-context";
import { readPosting, researchTarget, startEarlyResearch } from "./pipeline-research";
import { planResume } from "./plan";
import { findCachedResume, findLiveResume, isCurrentBank, rateLimitMessage } from "./records";
import { composeResearchText, type ResearchRecord } from "./research";
import { chooseSlug, isUsableSlug } from "./slug";
import type { ResumeRequest } from "@/prisma/awooga/client";
import type { ProgressEvent, ResumeRequestInput } from "./types";
import { validatePlan } from "./validate";

const GENERIC_FAILURE = "Something went wrong while tailoring the resume. Try again in a minute.";

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function findReusableSlug(context: PipelineContext): Promise<string | null> {
    const hint = context.input.slugHint?.trim().toLowerCase();
    const hinted = hint && isUsableSlug(hint) ? await findLiveResume(hint) : null;
    const cached = isCurrentBank(hinted) ? hinted : await findCachedResume(context.normalizedQuery);
    return cached?.slug ?? null;
}

async function screen(context: PipelineContext, research: ResearchRecord): Promise<HiringTarget | null> {
    const excerpt = research.posting ? `${research.posting.title ?? ""}\n${research.posting.text}` : "";
    const screening = screenWithModel(context.query, excerpt, context.deadline);
    scheduleTypesetterWarmup();
    const result = logLlmCall(context, "screen", await screening);
    if (!result.verdict.allowed || !result.target) {
        const reason = result.verdict.allowed ? "no hiring target found" : result.verdict.reason;
        await recordDecline(context, `screen: ${reason}`);
        return null;
    }
    context.target = { ...result.target, company: result.target.company ?? research.posting?.company ?? null };
    return context.target;
}

type TailorInput = { research: ResearchRecord; target: HiringTarget; slug: string; stale: ResumeRequest | null };

async function tailor(context: PipelineContext, { research, target, slug, stale }: TailorInput) {
    context.emit({ stage: "choosing" });
    const modelPlan = logLlmCall(
        context,
        "plan",
        await planResume({
            query: context.query,
            company: target.company,
            focus: target.focus,
            researchText: composeResearchText(research, target.company),
            deadline: context.deadline,
        }),
    );
    context.emit({ stage: "typesetting" });
    const focus = modelPlan.focus ?? target.focus;
    await typesetAndSave(context, slug, validatePlan(modelPlan.rankedBulletIds, modelPlan.rewrites), focus, stale);
    context.emit({ stage: "done", slug });
}

async function generate(context: PipelineContext): Promise<void> {
    const research = await readPosting(context);
    context.research = research;
    const early = startEarlyResearch(context, research);
    const target = await screen(context, research);
    if (!target) return;

    const slug = chooseSlug(context.input.slugHint, target.company, target.focus);
    if (!slug) return recordDecline(context, "no usable slug");
    const [existing, companyResearch] = await Promise.all([findLiveResume(slug), researchTarget(context, research, target, early)]);
    if (isCurrentBank(existing)) return recordReuse(context, slug);
    research.company = companyResearch;

    context.emit({ stage: "screening" });
    const researchVerdict = screenResearch(research);
    if (!researchVerdict.allowed) return recordDecline(context, `research: ${researchVerdict.reason}`);

    await tailor(context, { research, target, slug, stale: existing });
}

async function runStages(context: PipelineContext): Promise<void> {
    const prefilter = prefilterQuery(context.query);
    if (!prefilter.allowed) return recordDecline(context, `prefilter: ${prefilter.reason}`);

    const [reusable, limitMessage] = await Promise.all([findReusableSlug(context), rateLimitMessage(context.ipHash)]);
    if (reusable) return recordReuse(context, reusable);
    if (limitMessage) return recordFailure(context, limitMessage, "rate limited");

    await generate(context);
}
/**
 * Streams progress for one request. It never throws: every outcome, including errors, ends in
 * exactly one `done`, `declined` or `failed` event and one stored request row.
 */
export async function runResumePipeline(
    input: ResumeRequestInput,
    ip: string,
    emit: (event: ProgressEvent) => void,
): Promise<void> {
    const context = createContext(input, ip, emit);
    try {
        await runStages(context);
    } catch (error) {
        console.error("Resume pipeline failed", error);
        await recordFailure(context, GENERIC_FAILURE, describeError(error));
    }
}
