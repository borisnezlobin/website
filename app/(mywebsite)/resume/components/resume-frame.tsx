import type { ReactNode } from "react";
import { BlogHeroTexture } from "@/app/(mywebsite)/writing/[slug]/blog-hero-texture";

export type CanopyReach = "tall" | "short";

const CANOPY_HEIGHT: Record<CanopyReach, string> = {
    tall: "h-[clamp(12rem,36vh,24rem)]",
    short: "h-36",
};

export function CanopyBackdrop({ reach }: { reach: CanopyReach }) {
    return (
        <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 block overflow-hidden opacity-80 ${CANOPY_HEIGHT[reach]}`}>
            <BlogHeroTexture />
        </span>
    );
}

export function ResumeFrame({ rail, sheet }: { rail: ReactNode; sheet: ReactNode }) {
    return (
        <main className="relative select-text">
            <CanopyBackdrop reach="short" />
            <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-32 pt-28 sm:px-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,51rem)] lg:gap-14">
                <section className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">{rail}</section>
                {sheet}
            </section>
        </main>
    );
}

export type SheetSurface = "paper" | "blank";

const SURFACE_CLASS: Record<SheetSurface, string> = {
    paper: "bg-white",
    blank: "bg-white/70 backdrop-blur-sm dark:bg-dark-foreground/5",
};

export function PaperSheet({ surface, children, label }: { surface: SheetSurface; children: ReactNode; label?: string }) {
    return (
        <figure
            aria-label={label}
            className={`relative aspect-[8.5/11] w-full overflow-hidden rounded-sm shadow-[0_1px_2px_rgb(0_0_0/0.08),0_24px_60px_-20px_rgb(0_0_0/0.35)] ring-1 ring-black/5 dark:ring-white/10 ${SURFACE_CLASS[surface]}`}
        >
            {children}
        </figure>
    );
}
