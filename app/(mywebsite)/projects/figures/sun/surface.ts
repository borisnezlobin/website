import { cellIndex, type SunDisk } from "./disk-geometry";
import { atlasIndex, surfaceAtlas } from "./surface-atlas";
import { MAX_LATITUDE, MERIDIAN_LONGITUDES, wrapDegrees } from "./rotation-model";

const SURFACE_DENSITY = 0.03;
const SURFACE_BRIGHTNESS = 0.4;
const MERIDIAN_HALF_WIDTH = 2.6;

export type SunSurface = {
    disk: SunDisk;
    days: number;
    echoDays: number;
    echoWeight: number;
    meridianWeight: number;
};

type FacetSample = { index: number; activity: number; marked: boolean };

const coronaDensity = (rimRatio: number) => SURFACE_DENSITY + 0.12 * Math.exp(-(rimRatio - 1) * 9);

const onMeridian = (materialLongitude: number, latitude: number) => {
    if (Math.abs(latitude) > MAX_LATITUDE) return false;
    for (const meridian of MERIDIAN_LONGITUDES) {
        if (Math.abs(wrapDegrees(materialLongitude - meridian)) < MERIDIAN_HALF_WIDTH) return true;
    }
    return false;
};

const sampleDay = (disk: SunDisk, index: number, days: number) => {
    const latitude = disk.latitude[index];
    const material = disk.longitude[index] - disk.drift[index] * days;
    return { latitude, material, texel: atlasIndex(material, latitude) };
};

export const createSunSampler = () => {
    const last: FacetSample = { index: -1, activity: 0, marked: false };
    const atlas = surfaceAtlas();

    const densityOnDay = (disk: SunDisk, index: number, days: number, meridianWeight: number) => {
        const { latitude, material, texel } = sampleDay(disk, index, days);
        const activity = atlas.activity[texel];
        const texture = Math.min(1, (0.4 + 0.4 * atlas.grain[texel]) * (0.55 + 0.45 * disk.limb[index]) + 0.6 * activity);
        const marked = onMeridian(material, latitude);
        return { density: marked ? texture + (1 - texture) * meridianWeight : texture, activity, marked };
    };

    const density = (surface: SunSurface, cx: number, cy: number) => {
        const disk = surface.disk;
        const index = cellIndex(disk, cx, cy);
        const rim = disk.rimRatio[index];
        if (rim >= 1) return coronaDensity(rim);
        const current = densityOnDay(disk, index, surface.days, surface.meridianWeight);
        Object.assign(last, { index, activity: current.activity, marked: current.marked });
        if (surface.echoWeight <= 0) return current.density;
        const echo = densityOnDay(disk, index, surface.echoDays, 0);
        return current.density + (echo.density - current.density) * surface.echoWeight;
    };

    const brightness = (surface: SunSurface, cx: number, cy: number) => {
        const disk = surface.disk;
        const index = cellIndex(disk, cx, cy);
        if (disk.rimRatio[index] >= 1) return SURFACE_BRIGHTNESS;
        if (last.index !== index) Object.assign(last, { index, activity: 0, marked: false });
        const limbDarkening = 1 - 0.7 * (1 - disk.limb[index]);
        const accent = 1.1 + 3 * last.activity + (last.marked ? 2.2 * surface.meridianWeight : 0);
        return 0.2 + limbDarkening * accent;
    };

    return { density, brightness };
};
