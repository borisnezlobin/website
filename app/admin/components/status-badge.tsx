import type { Icon } from "@phosphor-icons/react";

export type StatusTone = "positive" | "caution" | "critical" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  caution: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  critical: "bg-primary-light-bg text-primary-light dark:bg-primary-dark-bg dark:text-primary-dark",
  neutral: "bg-neutral-100 text-light dark:bg-neutral-800 dark:text-dark",
};

export function StatusBadge({ tone, icon: StatusIcon, label }: { tone: StatusTone; icon: Icon; label: string }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2.5 text-sm font-medium ${TONE_CLASSES[tone]}`}
    >
      <StatusIcon size={16} weight="fill" aria-hidden />
      {label}
    </span>
  );
}
