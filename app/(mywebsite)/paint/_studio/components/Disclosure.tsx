import { CaretDown } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface DisclosureProps {
  summary: string
  children: ReactNode
}

export function Disclosure({ summary, children }: DisclosureProps) {
  return (
    <details className="group">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-[var(--radius-control)] px-1 text-sm font-semibold text-[rgb(var(--paint-ink-muted))] hover:text-[rgb(var(--paint-ink))] [&::-webkit-details-marker]:hidden">
        {summary}
        <CaretDown size={16} weight="bold" className="transition-[rotate] duration-150 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 pt-3">{children}</div>
    </details>
  )
}
