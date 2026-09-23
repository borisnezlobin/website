import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../components/button";

export default function LoadProblem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10"
    >
      <WarningCircleIcon size={20} weight="fill" className="shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <ArrowClockwiseIcon size={16} aria-hidden />
        Try again
      </Button>
    </section>
  );
}
