export type Vec3 = { x: number; y: number; z: number };

export type HeadCamera = Vec3 & {
    yaw: number;
    cosYaw: number;
    sinYaw: number;
    cosPitch: number;
    sinPitch: number;
    focal: number;
    cx: number;
    cy: number;
};

export const EYE_HEIGHT = 1.6;
const SWAY_SECONDS = 10;
const YAW_DEGREES = 8;
const SIDESTEP_METRES = 0.12;
const BOB_METRES = 0.02;
const PITCH_DEGREES = 1.4;
const HORIZON_FRACTION = 0.4;

export const createHeadCamera = (): HeadCamera => ({
    x: 0, y: EYE_HEIGHT, z: 0, yaw: 0, cosYaw: 1, sinYaw: 0, cosPitch: 1, sinPitch: 0, focal: 1, cx: 0, cy: 0,
});

export const swayCamera = (camera: HeadCamera, w: number, h: number, t: number) => {
    const phase = (2 * Math.PI * t) / SWAY_SECONDS;
    const turn = Math.sin(phase);
    const pitch = ((PITCH_DEGREES * Math.PI) / 180) * Math.sin(phase * 0.7 + 1.1);
    camera.yaw = ((YAW_DEGREES * Math.PI) / 180) * turn;
    camera.cosYaw = Math.cos(camera.yaw);
    camera.sinYaw = Math.sin(camera.yaw);
    camera.cosPitch = Math.cos(pitch);
    camera.sinPitch = Math.sin(pitch);
    camera.x = SIDESTEP_METRES * turn;
    camera.y = EYE_HEIGHT + BOB_METRES * Math.sin(phase * 2);
    camera.focal = Math.min(h * 1.15, w * 0.6);
    camera.cx = w / 2;
    camera.cy = h * HORIZON_FRACTION;
};

export const cameraDepth = (camera: HeadCamera, p: Vec3) => {
    const dx = p.x - camera.x, dy = p.y - camera.y, dz = p.z - camera.z;
    const z1 = dx * camera.sinYaw + dz * camera.cosYaw;
    return -dy * camera.sinPitch + z1 * camera.cosPitch;
};

export const project = (camera: HeadCamera, p: Vec3, out: { x: number; y: number }) => {
    const dx = p.x - camera.x, dy = p.y - camera.y, dz = p.z - camera.z;
    const x1 = dx * camera.cosYaw - dz * camera.sinYaw;
    const z1 = dx * camera.sinYaw + dz * camera.cosYaw;
    const y2 = dy * camera.cosPitch + z1 * camera.sinPitch;
    const z2 = Math.max(0.05, -dy * camera.sinPitch + z1 * camera.cosPitch);
    out.x = camera.cx + (camera.focal * x1) / z2;
    out.y = camera.cy - (camera.focal * y2) / z2;
    return out;
};

export const viewRay = (camera: HeadCamera, sx: number, sy: number, out: Vec3) => {
    const a = (sx - camera.cx) / camera.focal, b = -(sy - camera.cy) / camera.focal;
    const z1 = b * camera.sinPitch + camera.cosPitch;
    out.y = b * camera.cosPitch - camera.sinPitch;
    out.x = a * camera.cosYaw + z1 * camera.sinYaw;
    out.z = -a * camera.sinYaw + z1 * camera.cosYaw;
    return out;
};
