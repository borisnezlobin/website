import { easeInOutSine, easeOutCubic, lerp, progressBetween } from "../kit/easing";
import { WINNER, type RoundSeat } from "./demo-round";

export const ROUND_SECONDS = 9;
const GROW_SECONDS = 0.75;
export const REVEAL_AT = 4.4;
const REVEAL_SECONDS = 0.6;
const COLLAPSE_FROM = 7.7;
const COLLAPSE_TO = 8.7;

const SEALED_BRIGHTNESS = 1.3;
const DECLINED_BRIGHTNESS = 0.45;
const BID_BRIGHTNESS = 2.4;
const WINNER_BRIGHTNESS = 5.5;
const LOSER_BRIGHTNESS = 1.4;
const ARRIVAL_FLASH = 3;

export type RoundMoment = { reveal: number; settle: number };

export type SeatState = { opened: number; score: number; brightness: number; arrival: number };

export const roundMoment = (time: number): RoundMoment => {
    const settle = 1 - easeInOutSine(progressBetween(COLLAPSE_FROM, COLLAPSE_TO, time));
    return { reveal: easeInOutSine(progressBetween(REVEAL_AT, REVEAL_AT + REVEAL_SECONDS, time)) * settle, settle };
};

const bidBrightness = (seat: RoundSeat, moment: RoundMoment, arrival: number) => {
    const settled = seat === WINNER ? WINNER_BRIGHTNESS : LOSER_BRIGHTNESS;
    const flash = Math.sin(Math.PI * arrival) * ARRIVAL_FLASH;
    return lerp(BID_BRIGHTNESS, settled, moment.reveal) + flash;
};

export const seatState = (seat: RoundSeat, time: number, moment: RoundMoment, out: SeatState) => {
    const arrival = progressBetween(seat.answersAt, seat.answersAt + GROW_SECONDS, time);
    out.opened = easeOutCubic(arrival) * moment.settle;
    out.arrival = arrival < 1 ? arrival : 0;
    out.score = seat.score;
    const answered = seat.agent === null
        ? DECLINED_BRIGHTNESS
        : bidBrightness(seat, moment, out.arrival);
    out.brightness = lerp(SEALED_BRIGHTNESS, answered, out.opened);
};
