export const rotationRate = (latitude: number) => {
    const squared = latitude * latitude;
    return 13.6 - 0.00069 * squared + 9.64e-8 * squared * squared;
};

export const VIEW_FRAME_RATE = 12.3;

export const driftRate = (latitude: number) => rotationRate(latitude) - VIEW_FRAME_RATE;

export const MAX_LATITUDE = 60;
export const MERIDIAN_LONGITUDES = [-55, -25, 5, 35];
export const LOOP_DAYS = 21;
export const DAYS_PER_SECOND = 1.5;
export const STILL_DAY = 12;

export const wrapDegrees = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;
