import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TIMEOUT_MS = 6_000;
const MAX_BYTES = 500 * 1024;
const MAX_REDIRECTS = 3;
const USER_AGENT = "borisnezlobin.com resume tailor (+https://borisnezlobin.com/resume)";

const BLOCKED_IPV4_PREFIXES: [number, number, number][] = [
    // [first octet, second octet low, second octet high]
    [0, 0, 255],
    [10, 0, 255],
    [100, 64, 127],
    [127, 0, 255],
    [169, 254, 254],
    [172, 16, 31],
    [192, 168, 168],
    [198, 18, 19],
];

function isBlockedIpv4(address: string): boolean {
    const [first, second] = address.split(".").map(Number);
    if (first >= 224) return true;
    return BLOCKED_IPV4_PREFIXES.some(([octet, low, high]) => first === octet && second >= low && second <= high);
}

function isBlockedIpv6(address: string): boolean {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedIpv4) return isBlockedIpv4(mappedIpv4[1]);
    if (normalized === "::" || normalized === "::1") return true;
    return /^(fc|fd|fe[89ab]|ff)/.test(normalized);
}

function isBlockedAddress(address: string): boolean {
    return isIP(address) === 6 ? isBlockedIpv6(address) : isBlockedIpv4(address);
}

async function assertPublicHttpsUrl(url: URL): Promise<void> {
    if (url.protocol !== "https:") throw new Error(`Only https is allowed: ${url.href}`);
    if (url.username || url.password) throw new Error("Credentials in URLs are not allowed");
    if (url.port && url.port !== "443") throw new Error("Only the default https port is allowed");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
        throw new Error(`Refusing to fetch a private address: ${url.hostname}`);
    }
}

async function readCapped(response: Response): Promise<string> {
    if (!response.body) return "";
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);
    const buffer = Buffer.concat(chunks).subarray(0, MAX_BYTES);
    return new TextDecoder().decode(buffer);
}

function redirectTarget(response: Response, current: URL): URL | null {
    if (response.status < 300 || response.status >= 400) return null;
    const location = response.headers.get("location");
    if (!location) return null;
    const next = new URL(location, current);
    // Boards often redirect to their own http URL; the request itself still goes out over https.
    if (next.protocol === "http:") next.protocol = "https:";
    return next;
}

export type SafeFetchResult = { url: string; contentType: string; body: string };

/**
 * Fetches a public https URL for research. Every hop, including redirects, is resolved and
 * checked against private, loopback and link-local ranges before any request is sent.
 */
export async function safeFetch(rawUrl: string, accept = "text/html,application/json"): Promise<SafeFetchResult> {
    let current = new URL(rawUrl);
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        await assertPublicHttpsUrl(current);
        const response = await fetch(current, {
            redirect: "manual",
            signal,
            headers: { accept, "user-agent": USER_AGENT },
        });
        const next = redirectTarget(response, current);
        if (next) {
            current = next;
            continue;
        }
        if (!response.ok) throw new Error(`${current.href} returned ${response.status}`);
        const body = await readCapped(response);
        return { url: current.href, contentType: response.headers.get("content-type") ?? "", body };
    }
    throw new Error(`Too many redirects from ${rawUrl}`);
}

export async function safeFetchJson(url: string): Promise<unknown> {
    const { body } = await safeFetch(url, "application/json");
    return JSON.parse(body);
}
