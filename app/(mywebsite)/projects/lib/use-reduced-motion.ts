"use client";

import { useMediaQuery } from "./use-media-query";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** For code that only runs in the browser, where reading the query once is enough. */
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;

export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION);
