export type Vec3 = [number, number, number];

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function linearSrgbToOklab(r: number, g: number, b: number): Vec3 {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

export function rgbToOklab(r: number, g: number, b: number): Vec3 {
  return linearSrgbToOklab(srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b));
}

export function oklabToRgb(L: number, a: number, b: number): Vec3 {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return [
    Math.round(Math.max(0, Math.min(1, linearChannelToSrgb(lr))) * 255),
    Math.round(Math.max(0, Math.min(1, linearChannelToSrgb(lg))) * 255),
    Math.round(Math.max(0, Math.min(1, linearChannelToSrgb(lb))) * 255),
  ];
}

export function oklabSqDist(a: Vec3, b: Vec3): number {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

/**
 * Mean color in OKLab over an image's pixels. We use this as each photo's
 * representative color for mosaic matching: the rendered 32×32 tile is
 * essentially a downscaled version of the photo, so the perceived tile color
 * IS the mean. Matching against the mean keeps the rendered tile aligned
 * with the cell it's filling — important for photos with frames or large
 * backgrounds that would otherwise hijack a single dominant cluster.
 */
export function extractMeanColorOklab(
  rgb: Buffer | Uint8Array,
  pixelCount: number,
): Vec3 {
  if (pixelCount <= 0) return [0, 0, 0];
  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 3;
    const [L, a, b] = rgbToOklab(rgb[o], rgb[o + 1], rgb[o + 2]);
    sumL += L;
    sumA += a;
    sumB += b;
  }
  return [sumL / pixelCount, sumA / pixelCount, sumB / pixelCount];
}
