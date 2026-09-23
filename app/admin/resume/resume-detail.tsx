"use client";

import { ArrowLeftIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import type { AdminResumeDetail } from "@/app/lib/resume/types";
import { Button } from "../components/button";
import DeleteSlugControl from "./delete-slug-control";
import { formatLatency, formatRequestTime } from "./format";
import JsonBlock from "./json-block";
import LoadProblem from "./load-problem";
import PlanView from "./plan-view";
import { describeRequest, postingTitle } from "./request-summary";
import { ResumeStatusBadge } from "./resume-status";
import SlugLink from "./slug-link";
import { useResumeDetail, withoutSlug } from "./use-resume-requests";

function ExternalLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="text-muted dark:text-muted-dark">None</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-primary">
      {label}
      <ArrowSquareOutIcon size={14} aria-label="opens in a new tab" />
    </a>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted dark:text-muted-dark">{term}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </span>
  );
}

function orNone(value: string | null) {
  return value || <span className="text-muted dark:text-muted-dark">None</span>;
}

function RequestFacts({ detail }: { detail: AdminResumeDetail }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10 md:grid-cols-4">
      <Fact term="Slug"><SlugLink slug={detail.slug} /></Fact>
      <Fact term="Company">{orNone(detail.company)}</Fact>
      <Fact term="Model"><span className="font-mono">{orNone(detail.model)}</span></Fact>
      <Fact term="Provider">{orNone(detail.provider)}</Fact>
      <Fact term="Latency"><span className="tabular-nums">{formatLatency(detail.latencyMs) || "Not recorded"}</span></Fact>
      <Fact term="Requested">{formatRequestTime(detail.createdAt)}</Fact>
      <Fact term="Job posting"><ExternalLink href={detail.jobUrl} label="Open posting" /></Fact>
      <Fact term="PDF"><ExternalLink href={detail.pdfUrl} label="Open PDF" /></Fact>
      <span className="col-span-2 md:col-span-4">
        <Fact term="Focus">{orNone(detail.focus)}</Fact>
      </span>
    </dl>
  );
}

function RequestHeading({ detail }: { detail: AdminResumeDetail }) {
  const request = describeRequest(detail.query);
  if (request.kind === "text") return <h1 className="text-xl font-semibold">{detail.query}</h1>;

  const title = postingTitle(detail.research) ?? request.tail;
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <h1 className="text-xl font-semibold">{title ? `${title} — ${request.host}` : request.host}</h1>
      <a
        href={request.href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm text-muted underline underline-offset-2 hover:text-primary dark:text-muted-dark"
      >
        {request.href}
      </a>
    </span>
  );
}

function DetailBody({ detail, onSlugDeleted }: { detail: AdminResumeDetail; onSlugDeleted: () => void }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <span className="flex min-w-0 flex-col items-start gap-2">
          <ResumeStatusBadge status={detail.status} />
          <RequestHeading detail={detail} />
        </span>
        {detail.slug && <DeleteSlugControl slug={detail.slug} onDeleted={onSlugDeleted} />}
      </header>
      {detail.status === "DECLINED" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          {detail.declineReason || "Declined without a recorded reason."}
        </p>
      )}
      <RequestFacts detail={detail} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Plan</h2>
        <PlanView plan={detail.plan} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Research</h2>
        {detail.research == null ? (
          <p className="text-sm text-muted dark:text-muted-dark">No research was saved for this request.</p>
        ) : (
          <JsonBlock value={detail.research} label="Research JSON" />
        )}
      </section>
    </article>
  );
}

export default function ResumeDetail({
  id,
  onBack,
  onSlugDeleted,
}: {
  id: string;
  onBack: () => void;
  onSlugDeleted: (id: string) => void;
}) {
  const { result, setResult, reload } = useResumeDetail(id);

  function markSlugDeleted() {
    if (result.state === "ready") setResult({ state: "ready", value: withoutSlug(result.value) });
    onSlugDeleted(id);
  }

  return (
    <span className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
        <ArrowLeftIcon size={16} aria-hidden />
        All requests
      </Button>
      {result.state === "loading" && <p className="text-sm text-muted dark:text-muted-dark">Loading request…</p>}
      {result.state === "error" && <LoadProblem message={result.message} onRetry={reload} />}
      {result.state === "ready" && <DetailBody detail={result.value} onSlugDeleted={markSlugDeleted} />}
    </span>
  );
}
