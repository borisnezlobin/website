import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin-auth";
import { deleteResumeRow, deleteResumeRowsByStatus, deleteResumeSlug } from "@/app/lib/resume/store";
import type { ResumeRequest, ResumeStatus } from "@/prisma/awooga/client";
import type { AdminResumeDetail, AdminResumeRow } from "@/app/lib/resume/types";

export const dynamic = "force-dynamic";

const ROW_LIMIT = 500;

function toAdminRow(row: ResumeRequest): AdminResumeRow {
    return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        query: row.query,
        jobUrl: row.jobUrl,
        slug: row.slug,
        company: row.company,
        status: row.status,
        declineReason: row.declineReason,
        provider: row.provider,
        model: row.model,
        latencyMs: row.latencyMs,
        pdfUrl: row.pdfUrl,
    };
}

function toAdminDetail(row: ResumeRequest): AdminResumeDetail {
    return { ...toAdminRow(row), focus: row.focus, plan: row.plan, research: row.research };
}

function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function detailResponse(id: string) {
    const row = await db.resumeRequest.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ detail: toAdminDetail(row) });
}

export async function GET(request: NextRequest) {
    if (!isAdmin(request)) return unauthorized();
    const id = request.nextUrl.searchParams.get("id");
    if (id) return detailResponse(id);
    const rows = await db.resumeRequest.findMany({ orderBy: { createdAt: "desc" }, take: ROW_LIMIT });
    return NextResponse.json({ rows: rows.map(toAdminRow) });
}

const DELETABLE_STATUSES: ResumeStatus[] = ["GENERATED", "DECLINED", "FAILED"];

function asStatus(value: string): ResumeStatus | null {
    const upper = value.toUpperCase() as ResumeStatus;
    return DELETABLE_STATUSES.includes(upper) ? upper : null;
}

function notFound(what: string) {
    return NextResponse.json({ error: what }, { status: 404 });
}

async function deleteByStatus(value: string) {
    const status = asStatus(value);
    if (!status) return NextResponse.json({ error: `status must be one of ${DELETABLE_STATUSES.join(", ")}` }, { status: 400 });
    return NextResponse.json({ ok: true, deleted: await deleteResumeRowsByStatus(status) });
}

/** `id` deletes one row, `status` clears a batch of them, and `slug` only frees the slug. */
export async function DELETE(request: NextRequest) {
    if (!isAdmin(request)) return unauthorized();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    if (id) return (await deleteResumeRow(id)) ? NextResponse.json({ ok: true }) : notFound("No request with that id");

    const status = searchParams.get("status");
    if (status) return deleteByStatus(status);

    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Pass ?id=, ?status= or ?slug=" }, { status: 400 });
    return (await deleteResumeSlug(slug)) ? NextResponse.json({ ok: true }) : notFound("No resume at that slug");
}
