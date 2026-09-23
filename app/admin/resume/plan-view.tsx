import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import bullets from "@/app/lib/resume/data/bullets.json";
import type { BulletRewrite, ResumePlan } from "@/app/lib/resume/types";
import JsonBlock from "./json-block";

const ORIGINAL_TEXT_BY_ID = new Map<string, string>(bullets.map((bullet) => [bullet.id, bullet.text]));

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRewrite(value: unknown): value is BulletRewrite {
  const candidate = value as BulletRewrite | null;
  return typeof candidate?.id === "string" && typeof candidate?.text === "string";
}

export function asResumePlan(value: unknown): ResumePlan | null {
  const candidate = value as Partial<ResumePlan> | null;
  if (!candidate || !isStringArray(candidate.rankedBulletIds)) return null;
  const rewrites = Array.isArray(candidate.rewrites) ? candidate.rewrites.filter(isRewrite) : [];
  const skillsOrder = isStringArray(candidate.skillsOrder) ? candidate.skillsOrder : undefined;
  return { rankedBulletIds: candidate.rankedBulletIds, rewrites, skillsOrder };
}

function OriginalText({ bulletId }: { bulletId: string }) {
  const text = ORIGINAL_TEXT_BY_ID.get(bulletId);
  if (text === undefined) {
    return <p className="text-sm italic text-muted dark:text-muted-dark">This id is not in bullets.json.</p>;
  }
  return <p className="text-sm">{text}</p>;
}

function RankedBullet({ rank, bulletId, rewrite }: { rank: number; bulletId: string; rewrite?: string }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-x-3 py-3">
      <span className="text-right text-sm tabular-nums text-muted dark:text-muted-dark">{rank}</span>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="font-mono text-sm text-muted dark:text-muted-dark">{bulletId}</span>
        {rewrite === undefined ? (
          <OriginalText bulletId={bulletId} />
        ) : (
          <span className="grid gap-3 md:grid-cols-2">
            <span className="flex flex-col gap-1 opacity-70">
              <span className="text-sm text-muted dark:text-muted-dark">Original</span>
              <OriginalText bulletId={bulletId} />
            </span>
            <span className="flex flex-col gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/60">
              <span className="flex items-center gap-1 text-sm text-primary">
                <PencilSimpleIcon size={14} weight="bold" aria-hidden />
                Rewrite
              </span>
              <p className="text-sm">{rewrite}</p>
            </span>
          </span>
        )}
      </span>
    </li>
  );
}

function SkillsOrder({ skills }: { skills: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">Skills order</h4>
      <ol className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <li key={skill} className="block rounded bg-neutral-100 px-2 py-0.5 text-sm dark:bg-neutral-800">
            {skill}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PlanView({ plan }: { plan: unknown }) {
  if (plan === null || plan === undefined) {
    return <p className="text-sm text-muted dark:text-muted-dark">No plan was saved for this request.</p>;
  }
  const parsed = asResumePlan(plan);
  if (!parsed) return <JsonBlock value={plan} label="Raw plan JSON (unrecognized shape)" />;

  const rewriteById = new Map(parsed.rewrites.map((rewrite) => [rewrite.id, rewrite.text]));
  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted dark:text-muted-dark">
        {parsed.rankedBulletIds.length} bullets ranked, {rewriteById.size} rewritten.
      </p>
      <ol className="divide-y divide-neutral-100 rounded-lg bg-white px-4 shadow-sm ring-1 ring-black/5 dark:divide-neutral-800 dark:bg-neutral-900 dark:ring-white/10">
        {parsed.rankedBulletIds.map((bulletId, index) => (
          <RankedBullet key={bulletId} rank={index + 1} bulletId={bulletId} rewrite={rewriteById.get(bulletId)} />
        ))}
      </ol>
      {parsed.skillsOrder && parsed.skillsOrder.length > 0 && <SkillsOrder skills={parsed.skillsOrder} />}
    </section>
  );
}
