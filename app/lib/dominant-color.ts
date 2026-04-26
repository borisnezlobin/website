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
 * k-means in OKLab on the pixels of an image. Returns the centroid of the
 * largest cluster — the "dominant" color — as [L, a, b]. Initialization is
 * deterministic (stride sampling) so the result is stable across runs.
 */
export function extractDominantColorOklab(
  rgb: Buffer | Uint8Array,
  pixelCount: number,
  k = 5,
  maxIter = 12,
): Vec3 {
  const points: Vec3[] = new Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 3;
    points[i] = rgbToOklab(rgb[o], rgb[o + 1], rgb[o + 2]);
  }

  const centroids: Vec3[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.min(points.length - 1, Math.floor((i + 0.5) * points.length / k));
    centroids.push([points[idx][0], points[idx][1], points[idx][2]]);
  }

  const assignments = new Int32Array(points.length);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = oklabSqDist(points[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }
    if (!changed && iter > 0) break;

    const sums: Vec3[] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      sums[c][0] += points[i][0];
      sums[c][1] += points[i][1];
      sums[c][2] += points[i][2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]];
      }
    }
  }

  const counts = new Int32Array(k);
  for (let i = 0; i < assignments.length; i++) counts[assignments[i]]++;
  let bestC = 0;
  for (let c = 1; c < k; c++) {
    if (counts[c] > counts[bestC]) bestC = c;
  }
  return centroids[bestC];
}
