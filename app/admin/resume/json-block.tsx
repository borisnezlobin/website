function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function JsonBlock({ value, label }: { value: unknown; label: string }) {
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-4 font-mono shadow-sm ring-1 ring-black/5 dark:ring-white/10 text-sm text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-900 dark:text-dark"
    >
      {stringify(value)}
    </pre>
  );
}
