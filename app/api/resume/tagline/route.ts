import { NextRequest, NextResponse } from "next/server";
import { prefilterQuery } from "@/app/lib/resume/gate";
import { isRecord } from "@/app/lib/resume/json";
import { clientIpFrom } from "@/app/lib/resume/request-meta";
import { predictTagline } from "@/app/lib/resume/tagline/jev";
import { allowTaglineRequest } from "@/app/lib/resume/tagline/rate-limit";
import { MAX_TAGLINE_INPUT, MIN_TAGLINE_INPUT, NO_PREDICTION, type TaglinePrediction } from "@/app/lib/resume/tagline/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readVisitorText(request: NextRequest): Promise<string | null> {
    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.text !== "string") return null;
    const text = body.text.trim();
    return text.length >= MIN_TAGLINE_INPUT && text.length <= MAX_TAGLINE_INPUT ? text : null;
}

async function safePrediction(text: string): Promise<TaglinePrediction> {
    try {
        return await predictTagline(text);
    } catch {
        return NO_PREDICTION;
    }
}

export async function POST(request: NextRequest) {
    const text = await readVisitorText(request);
    if (!text) return NextResponse.json({ error: "Send JSON with a text string of 1 to 200 characters." }, { status: 400 });
    if (!allowTaglineRequest(clientIpFrom(request.headers))) return NextResponse.json(NO_PREDICTION, { status: 429 });
    if (!prefilterQuery(text).allowed) return NextResponse.json(NO_PREDICTION);
    return NextResponse.json(await safePrediction(text));
}
