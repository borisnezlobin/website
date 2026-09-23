const REQUEST_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function formatRequestTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : REQUEST_TIME_FORMAT.format(date);
}

export function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) return "";
  if (latencyMs < 1000) return `${Math.round(latencyMs)} ms`;
  return `${(latencyMs / 1000).toFixed(1)} s`;
}

export function resumePath(slug: string): string {
  return `/resume/${slug}`;
}

export async function describeFailedResponse(res: Response): Promise<string> {
  if (res.status === 404) return "The resume admin API isn't available yet (404).";
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return `${body.error} (${res.status})`;
  } catch {
    // Non-JSON error bodies fall through to the status line.
  }
  return `The server answered ${res.status} ${res.statusText}.`.trim();
}
