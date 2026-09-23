import db from "@/app/lib/db";
import { Prisma, type ResumeRequest } from "@/prisma/awooga/client";
import { BANK_VERSION } from "./bank-version";

const HOUR_MS = 60 * 60 * 1000;
const PER_IP_PER_HOUR = 5;
const GLOBAL_PER_DAY = 60;

export type RequestRowData = Omit<Prisma.ResumeRequestCreateInput, "id" | "createdAt">;

export async function saveRequestRow(data: RequestRowData): Promise<ResumeRequest> {
    return db.resumeRequest.create({ data });
}

export function isUniqueSlugViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function findLiveResume(slug: string): Promise<ResumeRequest | null> {
    return db.resumeRequest.findFirst({ where: { slug, status: "GENERATED" } });
}

/** A resume built from a retired bullet bank is stale, so it is never served or reused. */
export function isCurrentBank(row: ResumeRequest | null): row is ResumeRequest {
    return row?.bankVersion === BANK_VERSION;
}

export async function findCachedResume(normalizedQuery: string): Promise<ResumeRequest | null> {
    const row = await db.resumeRequest.findFirst({
        where: { normalizedQuery, status: "GENERATED", slug: { not: null }, bankVersion: BANK_VERSION },
        orderBy: { createdAt: "desc" },
    });
    return row;
}

export async function replaceGeneratedRow(id: string, data: RequestRowData): Promise<ResumeRequest> {
    return db.resumeRequest.update({ where: { id }, data: { ...data, createdAt: new Date() } });
}

/**
 * Only requests that got past the deterministic prefilter and the limit itself count. The
 * pipeline writes `research` (even an empty one) for exactly those rows.
 */
const REACHED_THE_MODEL = { research: { not: Prisma.DbNull } } satisfies Prisma.ResumeRequestWhereInput;

export async function rateLimitMessage(ipHash: string): Promise<string | null> {
    const now = Date.now();
    const [recentForIp, recentForEveryone] = await Promise.all([
        db.resumeRequest.count({ where: { ...REACHED_THE_MODEL, ipHash, createdAt: { gte: new Date(now - HOUR_MS) } } }),
        db.resumeRequest.count({ where: { ...REACHED_THE_MODEL, createdAt: { gte: new Date(now - 24 * HOUR_MS) } } }),
    ]);
    if (recentForIp >= PER_IP_PER_HOUR) {
        return "You've made a lot of resumes in the last hour. Give it a little while and try again.";
    }
    if (recentForEveryone >= GLOBAL_PER_DAY) {
        return "The resume tailor has hit its limit for today. The standard resume is still here, and tomorrow it'll tailor again.";
    }
    return null;
}
