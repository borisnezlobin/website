import type { ProgressEvent, ResumeRequestInput } from "@/app/lib/resume/types";

export const RESUME_ENDPOINT = "/api/resume";

const RATE_LIMITED_MESSAGE = "You’ve made a few of these in a row, so the site is taking a breather. Try again in a few minutes, or read the standard one for now.";
const UNREACHABLE_MESSAGE = "The resume maker didn’t answer. Try again in a moment, or read the standard one for now.";
const CUT_OFF_MESSAGE = "The connection dropped before the page was ready. Try again, or read the standard one for now.";

function parseLine(line: string): ProgressEvent | null {
    const trimmed = line.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed) as ProgressEvent;
    } catch {
        return null;
    }
}

async function messageFromErrorResponse(response: Response): Promise<string> {
    if (response.status === 429) return RATE_LIMITED_MESSAGE;
    const body = await response.json().catch(() => null) as { message?: unknown } | null;
    return typeof body?.message === "string" ? body.message : UNREACHABLE_MESSAGE;
}

function failed(message: string): ProgressEvent {
    return { stage: "failed", message };
}

export function isFinalEvent(event: ProgressEvent): boolean {
    return event.stage === "done" || event.stage === "declined" || event.stage === "failed";
}

async function* linesOf(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";
    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";
        for (const line of lines) yield line;
    }
    yield buffered + decoder.decode();
}

async function openStream(input: ResumeRequestInput, signal: AbortSignal): Promise<Response | ProgressEvent> {
    try {
        return await fetch(RESUME_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
            signal,
        });
    } catch {
        return failed(UNREACHABLE_MESSAGE);
    }
}

export async function* requestResume(input: ResumeRequestInput, signal: AbortSignal): AsyncGenerator<ProgressEvent> {
    const response = await openStream(input, signal);
    if (!(response instanceof Response)) {
        yield response;
        return;
    }
    if (!response.ok || !response.body) {
        yield failed(await messageFromErrorResponse(response));
        return;
    }
    try {
        for await (const line of linesOf(response.body)) {
            const event = parseLine(line);
            if (!event) continue;
            yield event;
            if (isFinalEvent(event)) return;
        }
    } catch {
        // A dropped connection falls through to the cut-off message below.
    }
    if (signal.aborted) return;
    yield failed(CUT_OFF_MESSAGE);
}
