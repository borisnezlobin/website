export type RequestDisplay =
  | { kind: "text"; text: string }
  | { kind: "url"; host: string; tail: string | null; href: string };

function lastPathSegment(url: URL): string | null {
  const segment = url.pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return null;
  try {
    return decodeURIComponent(segment).replace(/[-_]+/g, " ");
  } catch {
    return segment;
  }
}

export function describeRequest(query: string): RequestDisplay {
  const trimmed = query.trim();
  if (!/^https?:\/\//i.test(trimmed)) return { kind: "text", text: trimmed };
  try {
    const url = new URL(trimmed);
    return { kind: "url", host: url.host.replace(/^www\./, ""), tail: lastPathSegment(url), href: trimmed };
  } catch {
    return { kind: "text", text: trimmed };
  }
}

export function postingTitle(research: unknown): string | null {
  const posting = (research as { posting?: { title?: unknown } } | null)?.posting;
  return typeof posting?.title === "string" && posting.title.trim() ? posting.title.trim() : null;
}

export default function RequestSummary({ query, title }: { query: string; title?: string | null }) {
  const request = describeRequest(query);
  if (request.kind === "text") return <span className="block truncate">{request.text}</span>;

  return (
    <span className="flex min-w-0 items-baseline gap-2 whitespace-nowrap" title={request.href}>
      <span className="shrink-0">{request.host}</span>
      <span className="truncate text-muted dark:text-muted-dark">{title ?? request.tail ?? "Job posting"}</span>
    </span>
  );
}
