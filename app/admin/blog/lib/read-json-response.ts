export async function readJsonResponse<T extends object>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: describeNonJsonFailure(res) } as T & { error?: string };
  }
}

function describeNonJsonFailure(res: Response): string {
  if (res.status === 413) return "The request was over Vercel's 4.5 MB limit";
  return `The server answered ${res.status} ${res.statusText}`.trim();
}
