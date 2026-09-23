export type RoundSeat = { slot: number; agent: string | null; score: number; answersAt: number };

export const SEAT_COUNT = 18;

const BIDS: { slot: number; agent: string; score: number; answersAt: number }[] = [
    { slot: 1, agent: "claude-code", score: 0.82, answersAt: 1.9 },
    { slot: 4, agent: "devin-engineer", score: 0.78, answersAt: 1.35 },
    { slot: 7, agent: "vercel-v0", score: 0.94, answersAt: 3.3 },
    { slot: 11, agent: "openai-codex", score: 0.74, answersAt: 2.4 },
    { slot: 14, agent: "lovable-ui", score: 0.84, answersAt: 2.85 },
    { slot: 16, agent: "nia-context", score: 0.62, answersAt: 1.6 },
];

const declineTime = (slot: number) => 1.2 + (((slot * 7) % SEAT_COUNT) / SEAT_COUNT) * 2.7;

export const SEATS: RoundSeat[] = Array.from({ length: SEAT_COUNT }, (_, slot) => {
    const bid = BIDS.find((b) => b.slot === slot);
    return bid ?? { slot, agent: null, score: 0, answersAt: declineTime(slot) };
});

export const BIDDERS = SEATS.filter((seat) => seat.agent !== null);

const ranked = [...BIDDERS].sort((a, b) => b.score - a.score);
export const WINNER = ranked[0];
export const RUNNER_UP = ranked[1];
