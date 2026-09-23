import { isRecord } from "../json";
import { LIKES, ROLES } from "./phrases";
import type { SlotPrediction, TaglinePrediction } from "./types";

const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const JEV_TIMEOUT_MS = 2_000;

const ROLE_PREFIX = "r";
const LIKE_PREFIX = "l";

function choiceCriteria(phrases: readonly string[], prefix: string, describe: (phrase: string) => string) {
    return Object.fromEntries(phrases.map((phrase, index) => [`${prefix}${index}`, describe(phrase)]));
}

const QUESTIONS = {
    role: {
        type: "choice",
        instructions: "The visitor is describing a job they are hiring for. Pick the one role of Boris's that best matches the job they describe.",
        criteria: choiceCriteria(ROLES, ROLE_PREFIX, (role) => `The job is for a ${role}.`),
    },
    likes: {
        type: "choice",
        instructions: "The visitor is describing a job they are hiring for. Pick the one interest of Boris's that is most relevant to the work in that job.",
        criteria: choiceCriteria(LIKES, LIKE_PREFIX, (like) => `The work involves ${like}.`),
    },
};

function readSlot(answers: Record<string, unknown>, question: string, prefix: string, count: number): SlotPrediction | null {
    const answer = answers[question];
    if (!isRecord(answer) || typeof answer.choice !== "string" || typeof answer.confidence !== "number") return null;
    if (!answer.choice.startsWith(prefix)) return null;
    const index = Number(answer.choice.slice(prefix.length));
    if (!Number.isInteger(index) || index < 0 || index >= count) return null;
    return { index, confidence: answer.confidence };
}

function readPrediction(body: unknown): TaglinePrediction {
    if (!isRecord(body) || !isRecord(body.answers)) return { predicted: false };
    const role = readSlot(body.answers, "role", ROLE_PREFIX, ROLES.length);
    const like = readSlot(body.answers, "likes", LIKE_PREFIX, LIKES.length);
    if (!role && !like) return { predicted: false };
    return { predicted: true, role, like };
}

export async function predictTagline(visitorText: string): Promise<TaglinePrediction> {
    const apiKey = process.env.TYPESAFE_API_KEY;
    if (!apiKey) return { predicted: false };
    const response = await fetch(JEV_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "jev-latest", state: visitorText, questions: QUESTIONS }),
        signal: AbortSignal.timeout(JEV_TIMEOUT_MS),
        cache: "no-store",
    });
    if (!response.ok) return { predicted: false };
    return readPrediction(await response.json());
}
