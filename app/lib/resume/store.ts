import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import db from "@/app/lib/db";
import type { ResumeRequest, ResumeStatus } from "@/prisma/awooga/client";
import { composeStandardResume } from "./render";
import { isRecord, readStringArray } from "./json";
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

export async function getResumeView(slug: string): Promise<ResumeView | null> {
    const row = await findLiveResume(slug);
    if (slug !== STANDARD_SLUG) return row ? toView(row) : null;
    // The standard resume is Boris's own; it is rebuilt whenever the bullet bank changes.
    if (isCurrentBank(row)) return toView(row);
    return toView(await buildStandardResume(row));
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
