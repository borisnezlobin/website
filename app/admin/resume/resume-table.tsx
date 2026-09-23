import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { AdminResumeRow } from "@/app/lib/resume/types";
import { formatLatency, formatRequestTime } from "./format";
import { ResumeStatusBadge } from "./resume-status";
import SlugLink from "./slug-link";

const HEADER_CELL = "px-3 py-2.5 text-left text-sm font-medium text-muted dark:text-muted-dark";
const CELL = "px-3 py-3 align-top text-sm";

function shortModelName(model: string): string {
  return model.split("/").at(-1) ?? model;
}

function ModelCell({ model, provider }: { model: string | null; provider: string | null }) {
  if (!model && !provider) return <span className="text-muted dark:text-muted-dark">Not recorded</span>;
  return (
    <span className="flex flex-col">
      <span className="max-w-56 truncate font-mono text-sm" title={model ?? undefined}>{model ? shortModelName(model) : "Unknown model"}</span>
      <span className="text-muted dark:text-muted-dark">{provider ?? "Unknown provider"}</span>
    </span>
  );
}

function RequestCell({ row, onOpen }: { row: AdminResumeRow; onOpen: () => void }) {
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onOpen}
        className="line-clamp-2 text-left font-medium text-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-dark"
      >
        {row.query}
      </button>
      {row.status === "DECLINED" && row.declineReason && (
        <span className="line-clamp-2 text-amber-800 dark:text-amber-300">{row.declineReason}</span>
      )}
    </span>
  );
}

function ResumeTableRow({ row, onOpen }: { row: AdminResumeRow; onOpen: (id: string) => void }) {
  const open = () => onOpen(row.id);
  return (
    <tr onClick={open} className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <td className={CELL}>
        <ResumeStatusBadge status={row.status} />
      </td>
      <td className={`${CELL} min-w-64 max-w-md`}>
        <RequestCell row={row} onOpen={open} />
      </td>
      <td className={CELL}>{row.company ?? <span className="text-muted dark:text-muted-dark">Unknown</span>}</td>
      <td className={CELL}>
        <SlugLink slug={row.slug} />
      </td>
      <td className={CELL}>
        <ModelCell model={row.model} provider={row.provider} />
      </td>
      <td className={`${CELL} whitespace-nowrap text-right tabular-nums`}>{formatLatency(row.latencyMs)}</td>
      <td className={`${CELL} whitespace-nowrap text-right tabular-nums text-muted dark:text-muted-dark`}>
        {formatRequestTime(row.createdAt)}
      </td>
      <td className={`${CELL} pl-0 text-muted dark:text-muted-dark`}>
        <CaretRightIcon size={16} aria-hidden />
      </td>
    </tr>
  );
}

export default function ResumeTable({ rows, onOpen }: { rows: AdminResumeRow[]; onOpen: (id: string) => void }) {
  return (
    <section className="relative overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <table className="w-full min-w-[56rem] border-collapse">
        <thead className="bg-neutral-50 dark:bg-neutral-800/60">
          <tr>
            <th scope="col" className={HEADER_CELL}>Status</th>
            <th scope="col" className={HEADER_CELL}>Request</th>
            <th scope="col" className={HEADER_CELL}>Company</th>
            <th scope="col" className={HEADER_CELL}>Slug</th>
            <th scope="col" className={HEADER_CELL}>Model</th>
            <th scope="col" className={`${HEADER_CELL} text-right`}>Latency</th>
            <th scope="col" className={`${HEADER_CELL} text-right`}>Requested</th>
            <th scope="col" className="w-8">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {rows.map((row) => (
            <ResumeTableRow key={row.id} row={row} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
