import Link from "next/link";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr";
import { STANDARD_SLUG } from "@/app/lib/resume/types";
import { resumePath } from "../lib/slug";
import { ActionLink } from "@/app/components/action";
import { PaperSheet } from "./resume-frame";

export function StandardPreview({ sheetUrl }: { sheetUrl: string | null }) {
    if (!sheetUrl) {
        return (
            <ActionLink href={resumePath(STANDARD_SLUG)} icon={<FileTextIcon className="size-4" />} className="hidden lg:inline-flex">
                Read my standard resume
            </ActionLink>
        );
    }

    return (
        <Link
            href={resumePath(STANDARD_SLUG)}
            className="group hidden flex-col gap-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-8 focus-visible:ring-offset-light-background dark:focus-visible:ring-offset-dark-background lg:flex"
        >
            <span className="block rotate-2 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-1 group-hover:rotate-0">
                <PaperSheet surface="paper">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a stored SVG page, not an optimisable photo */}
                    <img src={sheetUrl} alt="" className="h-full w-full object-contain" />
                </PaperSheet>
            </span>
            <span className="flex items-center gap-2 text-base underline decoration-muted/40 underline-offset-4 group-hover:decoration-current">
                <FileTextIcon aria-hidden="true" className="size-4" />
                <span className="text-inherit">Read my standard resume</span>
            </span>
        </Link>
    );
}
