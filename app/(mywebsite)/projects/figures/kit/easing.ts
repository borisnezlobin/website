import { clamp01 } from "../lib/motion";

export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const easeInOutSine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));

export const easeOutCubic = (u: number) => 1 - (1 - clamp01(u)) ** 3;

export const progressBetween = (start: number, end: number, x: number) => clamp01((x - start) / (end - start));

export const wrapTime = (seconds: number, period: number) => ((seconds % period) + period) % period;
