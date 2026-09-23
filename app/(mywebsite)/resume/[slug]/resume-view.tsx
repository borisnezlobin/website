import { ArrowLeftIcon, FilePdfIcon } from "@phosphor-icons/react/dist/ssr";
import type { ResumeView as ResumeViewData } from "@/app/lib/resume/types";
import { ActionLink } from "@/app/components/action";
import { PaperSheet, ResumeFrame } from "../components/resume-frame";
import { isStandardSlug } from "../lib/slug";

const MADE_ON = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function headingFor(view: ResumeViewData) {
    return isStandardSlug(view.slug) ? "My resume" : view.focus;
}

function pageAlt(view: ResumeViewData, index: number) {
    const tailoring = isStandardSlug(view.slug) ? "" : `, tailored to ${view.focus}`;
    return `Page ${index + 1} of Boris Nezlobin’s resume${tailoring}`;
}

function ResumePages({ view }: { view: ResumeViewData }) {
    return (
        <section aria-label="Resume" className="flex flex-col gap-8">
            {view.pageSvgUrls.map((url, index) => (
                <a key={url} href={view.pdfUrl} className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-8 focus-visible:ring-offset-light-background dark:focus-visible:ring-offset-dark-background">
                    <PaperSheet surface="paper">
                        {/* eslint-disable-next-line @next/next/no-img-element -- a stored SVG page, not an optimisable photo */}
                        <img src={url} alt={pageAlt(view, index)} className="h-full w-full object-contain" />
                    </PaperSheet>
                </a>
            ))}
        </section>
    );
}

export function ResumeView({ view, declined }: { view: ResumeViewData; declined: boolean }) {
    const standard = isStandardSlug(view.slug);

    const rail = (
        <>
            <ActionLink href="/resume" tone="subtle" icon={<ArrowLeftIcon className="size-4" />} className="self-start">
                {standard ? "Make one for your role" : "Make another resume"}
            </ActionLink>
            <section className="flex flex-col gap-3">
                <h1 className="text-3xl leading-tight [overflow-wrap:anywhere] [text-wrap:balance]">{headingFor(view)}</h1>
                {declined && (
                    <p className="text-base [text-wrap:pretty]">
                        I only tailor resumes for hiring requests, so here’s my standard one.
                    </p>
                )}
                <p className="text-sm text-muted dark:text-muted-dark">Made on {MADE_ON.format(new Date(view.createdAt))}</p>
            </section>
            <ActionLink href={view.pdfUrl} tone="solid" icon={<FilePdfIcon weight="bold" className="size-5" />} className="self-start">
                Download PDF
            </ActionLink>
        </>
    );

    return <ResumeFrame rail={rail} sheet={<ResumePages view={view} />} />;
}
