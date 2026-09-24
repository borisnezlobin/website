import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import db from "@/app/lib/db";
import type { ResumeRequest, ResumeStatus } from "@/prisma/awooga/client";
import { composeResume, composeStandardResume } from "./render";
import { isRecord, readStringArray } from "./json";
import type { BulletRewrite, ResumePlan } from "./types";
import { BANK_VERSION } from "./bank-version";
import { findLiveResume, isCurrentBank, isUniqueSlugViolation, replaceGeneratedRow, saveRequestRow } from "./records";
import { STANDARD_SLUG, type RenderedResume, type ResumeView } from "./types";

export type StoredFiles = { pdfUrl: string; pageSvgUrls: string[] };

const STANDARD_FOCUS = "General";

export async function uploadRenderedResume(slug: string, rendered: RenderedResume): Promise<StoredFiles> {
    const folder = `resumes/${slug}`;
    const options = { access: "public" as const, addRandomSuffix: true };
    const [pdf, ...pages] = await Promise.all([
        put(`${folder}/resume.pdf`, Buffer.from(rendered.pdf), { ...options, contentType: "application/pdf" }),
        ...rendered.pageSvgs.map((svg, index) =>
            put(`${folder}/page-${index + 1}.svg`, svg, { ...options, contentType: "image/svg+xml" }),
        ),
    ]);
    return { pdfUrl: pdf.url, pageSvgUrls: pages.map((page) => page.url) };
}

export async function deleteStoredFiles(urls: (string | null)[]): Promise<void> {
    const present = urls.filter((url): url is string => Boolean(url));
    if (present.length > 0) await del(present);
}

function tailoredBulletIds(plan: unknown): string[] {
    return isRecord(plan) ? readStringArray(plan, "renderedBulletIds") : [];
}

function toView(row: ResumeRequest): ResumeView | null {
    if (!row.slug || !row.pdfUrl) return null;
    return {
        slug: row.slug,
        company: row.company,
        focus: row.focus ?? row.company ?? row.slug,
        pdfUrl: row.pdfUrl,
        pageSvgUrls: row.pageSvgUrls,
        tailoredBulletIds: tailoredBulletIds(row.plan),
        createdAt: row.createdAt.toISOString(),
    };
}

function standardRowData(rendered: RenderedResume, files: StoredFiles) {
    return {
        query: STANDARD_SLUG,
        normalizedQuery: STANDARD_SLUG,
        slug: STANDARD_SLUG,
        focus: STANDARD_FOCUS,
        status: "GENERATED" as const,
        bankVersion: BANK_VERSION,
        plan: { renderedBulletIds: rendered.bulletIds, fill: rendered.fill },
        ...files,
    };
}

async function buildStandardResume(stale: ResumeRequest | null): Promise<ResumeRequest> {
    const rendered = await composeStandardResume();
    const files = await uploadRenderedResume(STANDARD_SLUG, rendered);
    const data = standardRowData(rendered, files);
    try {
        const row = stale ? await replaceGeneratedRow(stale.id, data) : await saveRequestRow(data);
        if (stale) await deleteStoredFiles([stale.pdfUrl, ...stale.pageSvgUrls]).catch(() => undefined);
        return row;
    } catch (error) {
        await deleteStoredFiles([files.pdfUrl, ...files.pageSvgUrls]).catch(() => undefined);
        const concurrentlyBuilt = isUniqueSlugViolation(error) ? await findLiveResume(STANDARD_SLUG) : null;
        if (!concurrentlyBuilt) throw error;
        return concurrentlyBuilt;
    }
}

function storedRewrites(plan: Record<string, unknown>): BulletRewrite[] {
    const rewrites = Array.isArray(plan.rewrites) ? plan.rewrites.filter(isRecord) : [];
    return rewrites.flatMap((rewrite) => {
        const { id, text } = rewrite;
        return typeof id === "string" && typeof text === "string" ? [{ id, text }] : [];
    });
}

/** Plans written before rankedBulletIds was stored still carry the bullets that were rendered. */
function storedPlan(plan: unknown): ResumePlan | null {
    if (!isRecord(plan)) return null;
    const ranked = readStringArray(plan, "rankedBulletIds");
    const rankedBulletIds = ranked.length > 0 ? ranked : readStringArray(plan, "renderedBulletIds");
    if (rankedBulletIds.length === 0) return null;
    return { rankedBulletIds, rewrites: storedRewrites(plan) };
}

/** Re-typesets a stored resume against the current renderer. No model calls and no research. */
async function reRenderStoredResume(row: ResumeRequest, plan: ResumePlan): Promise<ResumeRequest> {
    const rendered = await composeResume(plan);
    const files = await uploadRenderedResume(row.slug ?? STANDARD_SLUG, rendered);
    const previousFiles = [row.pdfUrl, ...row.pageSvgUrls];
    const updated = await db.resumeRequest.update({
        where: { id: row.id },
        data: {
            ...files,
            bankVersion: BANK_VERSION,
            plan: { ...(isRecord(row.plan) ? row.plan : {}), ...plan, renderedBulletIds: rendered.bulletIds, fill: rendered.fill },
        },
    });
    await deleteStoredFiles(previousFiles).catch(() => undefined);
    if (row.slug) revalidatePath(`/resume/${row.slug}`);
    return updated;
}

async function refreshedView(row: ResumeRequest): Promise<ResumeView | null> {
    const plan = storedPlan(row.plan);
    if (!plan) return toView(row);
    try {
        return toView(await reRenderStoredResume(row, plan));
    } catch (error) {
        console.error(`Could not re-render /resume/${row.slug} for bank ${BANK_VERSION}`, error);
        return toView(row);
    }
}

async function standardView(row: ResumeRequest | null): Promise<ResumeView | null> {
    try {
        return toView(await buildStandardResume(row));
    } catch (error) {
        console.error("Could not rebuild the standard resume", error);
        return row ? toView(row) : null;
    }
}

/** A resume built by an older bank or renderer is re-typeset on the first view after the change. */
export async function getResumeView(slug: string): Promise<ResumeView | null> {
    const row = await findLiveResume(slug);
    if (isCurrentBank(row)) return toView(row);
    if (slug === STANDARD_SLUG) return standardView(row);
    return row ? refreshedView(row) : null;
}

/** Frees the slug so the next visit regenerates it; the request row stays for the admin log. */
export async function deleteResumeSlug(slug: string): Promise<boolean> {
    const row = await db.resumeRequest.findUnique({ where: { slug } });
    if (!row) return false;
    await deleteStoredFiles([row.pdfUrl, ...row.pageSvgUrls]).catch((error) =>
        console.error(`Could not delete the files for /resume/${slug}`, error),
    );
    await db.resumeRequest.update({
        where: { id: row.id },
        data: { slug: null, pdfUrl: null, pageSvgUrls: [], slugDeletedAt: new Date() },
    });
    revalidatePath(`/resume/${slug}`);
    return true;
}

const MAX_BULK_DELETE = 500;

function blobUrlsOf(row: ResumeRequest): (string | null)[] {
    return [row.pdfUrl, ...row.pageSvgUrls];
}

/** Deleting a row takes its slug with it, so /resume/<slug> rebuilds on the next visit. */
async function forgetRow(row: ResumeRequest): Promise<void> {
    await deleteStoredFiles(blobUrlsOf(row)).catch((error) =>
        console.error(`Could not delete the files for resume request ${row.id}`, error),
    );
    if (row.slug) revalidatePath(`/resume/${row.slug}`);
}

export async function deleteResumeRow(id: string): Promise<boolean> {
    const row = await db.resumeRequest.findUnique({ where: { id } });
    if (!row) return false;
    await db.resumeRequest.delete({ where: { id } });
    await forgetRow(row);
    return true;
}

export async function deleteResumeRowsByStatus(status: ResumeStatus): Promise<number> {
    const rows = await db.resumeRequest.findMany({
        where: { status },
        orderBy: { createdAt: "asc" },
        take: MAX_BULK_DELETE,
    });
    if (rows.length === 0) return 0;
    await db.resumeRequest.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
    for (const row of rows) await forgetRow(row);
    return rows.length;
}
