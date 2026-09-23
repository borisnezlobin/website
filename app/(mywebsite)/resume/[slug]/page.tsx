import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import getMetadata from "@/app/lib/metadata";
import { getResumeView } from "@/app/lib/resume/store";
import { cleanSlug, isStandardSlug, queryFromSlug, resumePath } from "../lib/slug";
import { GenerateOnVisit } from "./generate-on-visit";
import { ResumeView } from "./resume-view";

type ResumeSlugProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ declined?: string }>;
};

const loadView = cache(getResumeView);

function titleFor(slug: string, focus: string | null) {
    if (isStandardSlug(slug)) return "Resume";
    return `Resume for ${focus ?? queryFromSlug(slug)}`;
}

export async function generateMetadata({ params }: ResumeSlugProps): Promise<Metadata> {
    const slug = cleanSlug((await params).slug);
    if (!slug) return getMetadata({ title: "Resume" });
    const view = await loadView(slug).catch(() => null);
    const metadata = getMetadata({ title: titleFor(slug, view?.focus ?? null) });
    if (isStandardSlug(slug)) return metadata;
    return { ...metadata, robots: { index: false, follow: false } };
}

export default async function ResumeSlugPage({ params, searchParams }: ResumeSlugProps) {
    const raw = (await params).slug;
    const slug = cleanSlug(raw);
    if (!slug) notFound();
    if (slug !== raw) redirect(resumePath(slug));

    const view = await loadView(slug);
    if (!view) return <GenerateOnVisit slug={slug} />;

    const declined = isStandardSlug(slug) && (await searchParams).declined === "1";
    return <ResumeView view={view} declined={declined} />;
}
