/**
 * How big the prints are and how many float at once for a given stage. On a phone they take a
 * larger share of the width and fewer are in the water at the same time.
 */
export type PrintSize = { width: number; height: number };
export type StreamShape = { longSide: number; onScreen: number; border: number };

const PHONE_WIDTH = 640;

export const isPhoneStage = (width: number) => width < PHONE_WIDTH;

export function streamShape(width: number, height: number): StreamShape {
    const phone = isPhoneStage(width);
    const longSide = phone ? width * 0.3 : Math.min(144, Math.max(104, width * 0.085));
    const crowd = Math.round((width * height) / (longSide * longSide * 9));
    return { longSide, onScreen: Math.max(phone ? 3 : 5, Math.min(phone ? 4 : 9, crowd)), border: phone ? 4 : 5 };
}

/** Fits a photo of `width` x `height` into a print whose longest side is `longSide`. */
export function printSize(width: number, height: number, longSide: number): PrintSize {
    const aspect = width / height;
    return aspect >= 1 ? { width: longSide, height: longSide / aspect } : { width: longSide * aspect, height: longSide };
}

/** Under reduced motion the prints rest along the banks; on a phone they are smaller so they fit. */
export const restingLongSide = (width: number) => (isPhoneStage(width) ? width * 0.22 : Math.min(150, Math.max(104, width * 0.085)));
