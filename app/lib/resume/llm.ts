import OpenAI from "openai";
import { parseOutermostJsonObject } from "./json";

export type ProviderName = "openrouter" | "fireworks";

type ModelTarget = {
    provider: ProviderName;
    model: string;
    extraBody: Record<string, unknown>;
    headers?: Record<string, string>;
};

type ProviderConfig = {
    baseURL: string;
    apiKeyEnv: string;
    targets: ModelTarget[];
};

export type JsonCompletion<T> = {
    value: T;
    provider: ProviderName;
    model: string;
    latencyMs: number;
    failures: string[];
    usage: TokenUsage | null;
};

export type TokenUsage = { promptTokens: number; cachedPromptTokens: number; completionTokens: number };

export type JsonCompletionRequest<T> = {
    system: string;
    user: string;
    parse: (value: unknown) => T | null;
    deadline: number;
    maxTokens?: number;
};

const REQUEST_TIMEOUT_MS = 20_000;
const MIN_USEFUL_TIME_MS = 3_000;

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
    openrouter: {
        baseURL: "https://openrouter.ai/api/v1",
        apiKeyEnv: "OPENROUTER_API_KEY",
        targets: [
            "nvidia/nemotron-3-super-120b-a12b:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "qwen/qwen3.8-27b:free",
        ].map((model) => ({ provider: "openrouter", model, extraBody: { reasoning: { effort: "none" } } })),
    },
    fireworks: {
        baseURL: "https://api.fireworks.ai/inference/v1",
        apiKeyEnv: "FIREWORKS_API_KEY",
        targets: [
            {
                provider: "fireworks",
                model: "accounts/fireworks/models/deepseek-v4p1-flash",
                extraBody: { reasoning_effort: "none" },
                // Fireworks only reuses its prompt cache when requests land on the same replica.
                headers: { "x-session-affinity": "borisnezlobin-resume" },
            },
        ],
    },
};

const clients = new Map<ProviderName, OpenAI>();

function clientFor(provider: ProviderName): OpenAI | null {
    const cached = clients.get(provider);
    if (cached) return cached;
    const config = PROVIDERS[provider];
    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) return null;
    const client = new OpenAI({ apiKey, baseURL: config.baseURL, maxRetries: 0 });
    clients.set(provider, client);
    return client;
}

function primaryProvider(): ProviderName {
    return process.env.RESUME_PROVIDER === "fireworks" ? "fireworks" : "openrouter";
}

function orderedTargets(): ModelTarget[] {
    const primary = primaryProvider();
    const secondary: ProviderName = primary === "openrouter" ? "fireworks" : "openrouter";
    return [...PROVIDERS[primary].targets, ...PROVIDERS[secondary].targets];
}

// The OpenRouter account holds paid credits; only `:free` models may ever be called on it.
function assertFreeOpenRouterModel(target: ModelTarget): void {
    if (target.provider === "openrouter" && !target.model.endsWith(":free")) {
        throw new Error(`Refusing to call non-free OpenRouter model ${target.model}`);
    }
}

type CompletionBody = {
    choices?: { message?: { content?: string | null } }[];
    error?: { message?: string; code?: number };
    usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } | null };
};

type ParsedCompletion<T> = { value: T; usage: TokenUsage | null };

function readUsage(completion: CompletionBody): TokenUsage | null {
    const usage = completion.usage;
    if (!usage) return null;
    return {
        promptTokens: usage.prompt_tokens ?? 0,
        cachedPromptTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
    };
}

// OpenRouter reports upstream failures (overloads, rate limits) as HTTP 200 with an `error` body.
function messageContent(completion: CompletionBody): string {
    if (completion.error || !completion.choices?.length) {
        const { code, message } = completion.error ?? {};
        throw new Error(`upstream ${code ?? "error"}: ${message ?? "no choices returned"}`);
    }
    return completion.choices[0].message?.content ?? "";
}

async function requestJson<T>(
    client: OpenAI,
    target: ModelTarget,
    request: JsonCompletionRequest<T>,
): Promise<ParsedCompletion<T>> {
    assertFreeOpenRouterModel(target);
    const timeout = Math.min(REQUEST_TIMEOUT_MS, request.deadline - Date.now());
    const body = {
        model: target.model,
        messages: [
            { role: "system" as const, content: request.system },
            { role: "user" as const, content: request.user },
        ],
        response_format: { type: "json_object" as const },
        temperature: 0.2,
        max_tokens: request.maxTokens ?? 2_000,
        ...target.extraBody,
    };
    const completion = await client.chat.completions.create(body, { timeout, headers: target.headers });
    const parsed = request.parse(parseOutermostJsonObject(messageContent(completion)));
    if (parsed === null) throw new Error(`${target.model} returned JSON of the wrong shape`);
    return { value: parsed, usage: readUsage(completion) };
}

function describeFailure(target: ModelTarget, error: unknown): string {
    const status = error instanceof OpenAI.APIError ? ` ${error.status ?? "no status"}` : "";
    const message = error instanceof Error ? error.message : String(error);
    return `${target.provider}/${target.model}${status}: ${message.slice(0, 200)}`;
}

/**
 * Tries each configured model in order and falls through on any failure (429s, 5xx,
 * timeouts, malformed JSON), so a flaky free model never sinks the request.
 */
export async function completeJson<T>(request: JsonCompletionRequest<T>): Promise<JsonCompletion<T>> {
    const failures: string[] = [];
    for (const target of orderedTargets()) {
        if (request.deadline - Date.now() < MIN_USEFUL_TIME_MS) break;
        const client = clientFor(target.provider);
        if (!client) continue;
        const startedAt = Date.now();
        try {
            const { value, usage } = await requestJson(client, target, request);
            const latencyMs = Date.now() - startedAt;
            return { value, usage, provider: target.provider, model: target.model, latencyMs, failures };
        } catch (error) {
            failures.push(describeFailure(target, error));
        }
    }
    throw new Error(`Every model failed. ${failures.join(" | ")}`);
}
