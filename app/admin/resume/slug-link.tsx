import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { resumePath } from "./format";

export default function SlugLink({ slug }: { slug: string | null }) {
  if (!slug) return <span className="text-sm text-muted dark:text-muted-dark">None</span>;

  return (
    <a
      href={resumePath(slug)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex max-w-56 items-start gap-1 rounded font-mono text-sm text-light underline decoration-neutral-300 underline-offset-2 hover:text-primary hover:decoration-current dark:text-dark dark:decoration-neutral-600"
    >
      <span className="min-w-0 break-words">{slug}</span>
      <ArrowSquareOutIcon size={14} className="mt-1 shrink-0" aria-label="opens in a new tab" />
    </a>
  );
}
