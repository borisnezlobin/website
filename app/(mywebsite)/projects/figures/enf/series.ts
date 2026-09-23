import enfData from "../../data/enf-2024-08-18.json";

export const HOUR_MHZ: readonly number[] = enfData.hour;
export const DAY_MHZ: readonly number[] = enfData.day;
export const HOUR_START_SECONDS = enfData.hourStartSeconds;
export const DAY_STEP_SECONDS = enfData.dayStepSeconds;
export const SECONDS_PER_DAY = 86400;

export const WINDOW_SAMPLES = 600;
export const SCALE_MHZ = 50;
export const DAY_SCALE_MHZ = 90;

export const hourSampleAt = (index: number) => {
    const i = Math.max(0, Math.min(HOUR_MHZ.length - 1, Math.floor(index)));
    const next = HOUR_MHZ[Math.min(HOUR_MHZ.length - 1, i + 1)];
    return HOUR_MHZ[i] + (next - HOUR_MHZ[i]) * (index - i);
};

export const formatHz = (mhz: number) => `${(50 + mhz / 1000).toFixed(3)} Hz`;

const twoDigits = (n: number) => String(n).padStart(2, "0");

export const formatClock = (index: number) => {
    const total = HOUR_START_SECONDS + Math.floor(index);
    return `${twoDigits(Math.floor(total / 3600))}:${twoDigits(Math.floor(total / 60) % 60)}:${twoDigits(total % 60)}`;
};
