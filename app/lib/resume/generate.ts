import { revalidatePath } from "next/cache";
import { rowDataFor, type PipelineContext } from "./pipeline-context";
import { findLiveResume, isUniqueSlugViolation, replaceGeneratedRow, saveRequestRow } from "./records";
import { composeResume, composeStandardResume } from "./render";
import { deleteStoredFiles, uploadRenderedResume, type StoredFiles } from "./store";
import type { ResumeRequest } from "@/prisma/awooga/client";
import type { RenderedResume, ResumePlan } from "./types";
import type { ValidatedPlan } from "./validate";

let typesetterWarmed = false;

// Measured: firing at 0 ms blocked the screen request from going out and added 100-200 ms to it.
const WARMUP_DELAY_MS = 250;

/**
 * The first Typst compile in a process costs 100-300 ms extra (measured). Compiling is synchronous,
 * so it runs once the screen request is in flight and the pipeline is only waiting on the network.
 */
export function scheduleTypesetterWarmup(): void {
    if (typesetterWarmed) return;
    typesetterWarmed = true;
    setTimeout(() => void composeStandardResume().catch(() => undefined), WARMUP_DELAY_MS);
}

type SaveInput = {
    context: PipelineContext;
    slug: string;
    files: StoredFiles;
    plan: Record<string, unknown>;
    focus: string;
    /** A resume already at this slug, built from a retired bullet bank; its row and blobs are replaced. */
    stale: ResumeRequest | null;
};

async function saveGeneratedRow({ context, slug, files, plan, focus, stale }: SaveInput): Promise<void> {
    const data = rowDataFor(context, { status: "GENERATED", slug, focus, ...files, plan });
    try {
        if (stale) await replaceGeneratedRow(stale.id, data);
        else await saveRequestRow(data);
    } catch (error) {
        await deleteStoredFiles([files.pdfUrl, ...files.pageSvgUrls]).catch(() => undefined);
        // Two visitors raced for the same slug; the first saved resume wins.
        const winner = isUniqueSlugViolation(error) ? await findLiveResume(slug) : null;
        if (!winner) throw error;
        return;
    }
    if (stale) await deleteStoredFiles([stale.pdfUrl, ...stale.pageSvgUrls]).catch(() => undefined);
}

type ComposedResume = { rendered: RenderedResume; plan: ResumePlan; rewritesDroppedAfterError: string | null };

/** A rewrite that slipped past validation can still break Typst; the original bullets always compile. */
async function composeWithFallback(plan: ResumePlan): Promise<ComposedResume> {
    try {
        return { rendered: await composeResume(plan), plan, rewritesDroppedAfterError: null };
    } catch (error) {
        if (plan.rewrites.length === 0) throw error;
        const withoutRewrites = { ...plan, rewrites: [] };
        const reason = error instanceof Error ? error.message.slice(0, 300) : String(error);
        return { rendered: await composeResume(withoutRewrites), plan: withoutRewrites, rewritesDroppedAfterError: reason };
    }
}

export async function typesetAndSave(
    context: PipelineContext,
    slug: string,
    validated: ValidatedPlan,
    focus: string,
    stale: ResumeRequest | null,
): Promise<void> {
    const { rendered, plan: renderedPlan, rewritesDroppedAfterError } = await composeWithFallback(validated.plan);
    const files = await uploadRenderedResume(slug, rendered);
    const plan = {
        ...renderedPlan,
        rewritesDroppedAfterError,
        rejectedRewrites: validated.rejectedRewrites,
        renderedBulletIds: rendered.bulletIds,
        fill: rendered.fill,
    };
    await saveGeneratedRow({ context, slug, files, plan, focus, stale });
    revalidatePath(`/resume/${slug}`);
}
