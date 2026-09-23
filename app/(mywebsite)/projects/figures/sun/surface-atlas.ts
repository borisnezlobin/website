import { smoothstep } from "../lib/motion";
import { valueNoise } from "../lib/value-noise";

const LONGITUDES = 360;
const LATITUDES = 181;

const activeBelt = (latitude: number) => Math.exp(-(((Math.abs(latitude) - 17) / 12) ** 2));

const buildAtlas = () => {
    const grain = new Float32Array(LONGITUDES * LATITUDES);
    const activity = new Float32Array(LONGITUDES * LATITUDES);
    for (let row = 0; row < LATITUDES; row++) {
        for (let lon = 0; lon < LONGITUDES; lon++) {
            const k = row * LONGITUDES + lon;
            grain[k] = valueNoise(lon / 4.5, row / 4, 80);
            activity[k] = smoothstep(0.46, 0.7, valueNoise(lon / 12, row / 7, 30)) * activeBelt(row - 90);
        }
    }
    return { grain, activity };
};

let atlas: ReturnType<typeof buildAtlas> | null = null;

export const atlasIndex = (materialLongitude: number, latitude: number) => {
    const lon = Math.round(materialLongitude + 180) % LONGITUDES;
    return Math.round(latitude + 90) * LONGITUDES + (lon < 0 ? lon + LONGITUDES : lon);
};

export const surfaceAtlas = () => {
    atlas ??= buildAtlas();
    return atlas;
};
