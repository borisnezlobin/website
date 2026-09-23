import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin-auth";
import { deleteResumeSlug } from "@/app/lib/resume/store";
import type { ResumeRequest } from "@/prisma/awooga/client";
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

export async function DELETE(request: NextRequest) {
    if (!isAdmin(request)) return unauthorized();
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Pass ?slug=" }, { status: 400 });
    const deleted = await deleteResumeSlug(slug);
    if (!deleted) return NextResponse.json({ error: "No resume at that slug" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
