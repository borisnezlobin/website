const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 60;
const FORGET_AFTER_ENTRIES = 5_000;

const recentRequests = new Map<string, number[]>();

function forgetStaleVisitors(now: number) {
    if (recentRequests.size < FORGET_AFTER_ENTRIES) return;
    for (const [ip, times] of recentRequests) {
        if (times[times.length - 1] < now - WINDOW_MS) recentRequests.delete(ip);
    }
}

export function allowTaglineRequest(ip: string, now = Date.now()): boolean {
    forgetStaleVisitors(now);
    const times = (recentRequests.get(ip) ?? []).filter((time) => time > now - WINDOW_MS);
    const allowed = times.length < REQUESTS_PER_WINDOW;
    if (allowed) times.push(now);
    recentRequests.set(ip, times);
    return allowed;
}
