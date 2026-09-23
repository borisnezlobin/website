import { createHash } from "node:crypto";

export function normalizeQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashIp(ip: string): string {
    return createHash("sha256").update(ip + (process.env.ADMIN_PASSWORD ?? "")).digest("hex");
}

export function clientIpFrom(headers: Headers): string {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
