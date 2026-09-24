import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { FOCUS_RING } from "@/app/components/action";
import type { IndexRow } from "../content/types";
import { AwardMark } from "./award-mark";
import { isInternalHref } from "./project-link";

export const INDEX_SECTION_ID = "more-projects";

const ROW_SHAPE = "-mx-3 flex flex-col gap-0.5 rounded-lg px-3 py-3 sm:flex-row sm:items-baseline sm:gap-6";
const NAME = "font-semibold sm:w-60 sm:shrink-0";
const WHAT = "flex-1 text-muted dark:text-muted-dark";
const NEW_TAB_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;

type YearGroup = { year: number; rows: IndexRow[] };

function groupByYear(rows: IndexRow[]): YearGroup[] {
    const groups: YearGroup[] = [];
    for (const row of rows) {
        const last = groups[groups.length - 1];
        if (last?.year === row.year) last.rows.push(row);
        else groups.push({ year: row.year, rows: [row] });
    }
    return groups;
}

function RowName({ row, className = "" }: { row: IndexRow; className?: string }) {
    return (
        <span className={`${NAME} ${className}`}>
            {row.name}
            {row.won && <AwardMark size={14} />}
        </span>
    );
}

function RowLink({ row, href }: { row: IndexRow; href: string }) {
    const external = !isInternalHref(href);
    const Arrow = external ? ArrowUpRightIcon : ArrowRightIcon;
    return (
        <Link
            href={href}
            className={`group ${ROW_SHAPE} ${FOCUS_RING} transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5`}
            {...(external ? NEW_TAB_PROPS : {})}
        >
            <RowName row={row} className="transition-colors duration-150 group-hover:text-primary" />
            <span className={WHAT}>{row.what}</span>
            <Arrow aria-hidden="true" size={16} className="hidden self-center text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block" />
            {external && <span className="sr-only"> (opens in a new tab)</span>}
        </Link>
    );
}

function Row({ row }: { row: IndexRow }) {
    if (row.href) return <RowLink row={row} href={row.href} />;
    return (
        <p className={ROW_SHAPE}>
            <RowName row={row} />
            <span className={WHAT}>{row.what}</span>
        </p>
    );
}

export function ProjectIndex({ rows }: { rows: IndexRow[] }) {
    const titleId = `${INDEX_SECTION_ID}-title`;
    return (
        <section id={INDEX_SECTION_ID} aria-labelledby={titleId} className="scroll-mt-20 pb-24">
            <h2 id={titleId} className="text-3xl font-bold">More projects</h2>
            <ul className="mt-8">
                {groupByYear(rows).map(({ year, rows: yearRows }) => (
                    <li key={year} className="grid border-t border-black/10 py-4 dark:border-white/10 md:grid-cols-[6rem_1fr]">
                        <h3 className="pb-1 pt-3 text-sm tabular-nums text-muted dark:text-muted-dark md:text-base">{year}</h3>
                        <ul className="list-none">
                            {yearRows.map((row) => (
                                <li key={row.id} id={row.id} className="scroll-mt-20">
                                    <Row row={row} />
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </section>
    );
}
