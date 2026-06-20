// Small pure helpers shared by the chart components.

// "Nice" round axis tick values spanning [min, max] (≈ count of them).
export function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min || 1;
  const rawStep = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-6; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

export const intComma = (n: number) => Math.round(n).toLocaleString("en-US");

export const metres = (n: number) => `${intComma(n)} m`;

export const km = (n: number) => `${n % 1 === 0 ? n : n.toFixed(1)} km`;
