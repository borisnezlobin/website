import type { NextRequest } from "next/server";

export function isAdmin(request: NextRequest): boolean {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.error("ADMIN_PASSWORD not set");
        return false;
    }
    return request.headers.get("Authorization") === `Bearer ${password}`;
}
