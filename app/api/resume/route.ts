import { NextRequest, NextResponse } from "next/server";
import { runResumePipeline } from "@/app/lib/resume/pipeline";
import { clientIpFrom } from "@/app/lib/resume/request-meta";
import { isRecord } from "@/app/lib/resume/json";
import { isAdmin } from "@/app/lib/admin-auth";
import type { ProgressEvent, ResumeRequestInput } from "@/app/lib/resume/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function readInput(request: NextRequest): Promise<ResumeRequestInput | null> {
    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.query !== "string") return null;
    const slugHint = typeof body.slugHint === "string" ? body.slugHint : undefined;
    return { query: body.query, slugHint };
}

function progressStream(input: ResumeRequestInput, ip: string, unlimited: boolean): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            const emit = (event: ProgressEvent) => {
                try {
                    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
                } catch {
                    // The visitor closed the page; keep going so the resume still gets saved.
                }
            };
            await runResumePipeline(input, ip, emit, unlimited);
            try {
                controller.close();
            } catch {}
        },
    });
}

export async function POST(request: NextRequest) {
    const input = await readInput(request);
    if (!input) return NextResponse.json({ error: "Send JSON with a query string." }, { status: 400 });
    return new Response(progressStream(input, clientIpFrom(request.headers), isAdmin(request)), {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
        },
    });
}
