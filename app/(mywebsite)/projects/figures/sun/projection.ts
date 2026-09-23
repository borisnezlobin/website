const RAD = Math.PI / 180;
const AXIS_TILT = 7.25 * RAD;
const COS_TILT = Math.cos(AXIS_TILT), SIN_TILT = Math.sin(AXIS_TILT);

export type ScreenPoint = { x: number; y: number; depth: number };

export const surfaceToScreen = (latitude: number, longitude: number): ScreenPoint => {
    const lat = latitude * RAD, lon = longitude * RAD;
    const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
    return { x, y: y * COS_TILT - z * SIN_TILT, depth: y * SIN_TILT + z * COS_TILT };
};

export const screenToSurface = (u: number, v: number, depth: number) => {
    const y = v * COS_TILT + depth * SIN_TILT;
    const z = -v * SIN_TILT + depth * COS_TILT;
    return { latitude: Math.asin(Math.max(-1, Math.min(1, y))) / RAD, longitude: Math.atan2(u, z) / RAD };
};
