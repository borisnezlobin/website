
export function swimClockSeconds() {
    if (typeof performance === "undefined") return 0;
    return performance.now() / 1000;
}

export function crossingPhaseSeconds(cycleSeconds: number, staggerSeconds: number) {
    if (!(cycleSeconds > 0)) return 0;
    const elapsed = swimClockSeconds() - staggerSeconds;
    return ((elapsed % cycleSeconds) + cycleSeconds) % cycleSeconds;
}
