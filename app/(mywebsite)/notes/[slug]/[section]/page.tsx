import { readFileSync } from "fs";
import { getNoteSections, getHTMLNoteSections } from "../../getNoteSections";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ListIcon } from "@phosphor-icons/react/dist/ssr";
import getMetadata from "@/app/lib/metadata";
import NotFoundPage from "@/app/components/not-found-page";
import BackToRouteLink from "@/app/components/back-to-route";
import getNoteMdxPath, { getNoteHTMLPath } from "@/app/utils/get-note-mdx-path";
import { getNote, getNotes } from "@/app/lib/db-caches";

import { Wrapper } from "./skibidiwrapper";

export async function generateStaticParams() {
    if (!process.env.POSTGRES_URL_NON_POOLING) return [];
    const notes = await getNotes();

    return notes.flatMap(async (note) => {
        try {
            const sections = await getHTMLNoteSections(readFileSync(getNoteHTMLPath(note.slug), "utf-8"));
            const arr = sections.map((section) => ({ params: { slug: note.slug, section: section.slug } }));
            console.log("Generated paths for note", note.title);
            return arr;
        } catch (e) {
            console.log("Error generating paths for note", note.slug);
            console.error(e);
            return [];
        }
    });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, section: string }> }) {
    const { slug, section } = await params;
    const note = await getNote(slug);

    if (!note) {
        return getMetadata({
            title: "Notes not found.",
            info: "404",
            subtitle: "Boris Nezlobin.",
            description:
                "The requested notes couldn't be found. Visit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    const sections = await getHTMLNoteSections(readFileSync(getNoteHTMLPath(note.slug), "utf-8"));
    const sect = sections.find((s) => s.slug === section);

    if (!sect) {
        return getMetadata({
            title: `Section not found.`,
            subtitle: note.title,
            info: "Boris Nezlobin.",
            description:
                `The requested section couldn't be found in my ${note.title} notes. Visit my website to contact me, see what I'm up to, and learn more about me!`,
        });
    }

    return getMetadata({
        title: `${sect.title}`,
        subtitle: note.title,
        info: "Notes by Boris Nezlobin.",
        description: `Check out my ${sect.title} notes on ${note.title}! ${note.description} ${sections.length} sections. Made and published by Boris Nezlobin.`,
    });
}


const SectionPage = async ({ params }: { params: Promise<{ slug: string, section: string }> }) => {
    const { slug, section } = await params;
    const note = await getNote(slug);

    if (!note) {
        return (
            <NotFoundPage title="Notes not found." />
        )
    }

    const configDirectory = getNoteHTMLPath(note.slug);
    const content = readFileSync(configDirectory, "utf-8");
    const sections = await getHTMLNoteSections(content);

    const sectionIndex = sections.findIndex((sect) => sect.slug === section);

    if (sectionIndex === -1) {
        return (
            <NotFoundPage title={`Section of ${note.title} not found.`} />
        )
    }

    let sect = sections[sectionIndex];
    const isDraft = note.slug.includes("draft-") || sect.slug.includes("draft-");

    return (
        <>
            {/* {isDraft && (<DraftBadge />)} */}
            <div className="pagepad">
                <div className="z-[1] max-w-3xl ml-auto mr-auto relative w-full p-0 md:p-8">
                    <header className="border-b border-muted dark:border-muted-dark mb-6 pb-6">
                        <BackToRouteLink href={`/notes/${note.slug}`} text={note.title} />
                        <h1 className="text-3xl font-bold mb-2 emph">{sect.title}</h1>
                        <p className="text-muted dark:text-muted-dark mb-2">{sectionIndex + 1}/{sections.length} in {note.title}. <span><Link href={`/notes/${note.slug}`} className="link font-bold">See all</Link></span>.</p>
                    </header>
                    <Wrapper content={sect.content} />
                </div>
                <div className="w-full flex flex-row flex-wrap justify-between items-center gap-4 pt-8 print:!hidden">
                    {sectionIndex > 0 ? (
                        <Link href={`/notes/${note.slug}/${sections[sectionIndex - 1].slug}`} className="link">
                            <ArrowLeftIcon className="hidden sm:block" />
                            <span className="sm:hidden">Prev: </span>
                            <span className="underline">{sections[sectionIndex - 1].title}</span>
                        </Link>
                    ) : (
                        <Link href={`/notes/${note.slug}`} className="link">
                            <ArrowLeftIcon className="hidden sm:block" />
                            <span className="sm:hidden">Prev: </span>
                            <span className="underline">Table of Contents</span>
                        </Link>
                    )}
                    {sectionIndex < sections.length - 1 && (
                        <Link href={`/notes/${note.slug}/${sections[sectionIndex + 1].slug}`} className="link">
                            <span className="sm:hidden">Next: </span>
                            <span className="underline">{sections[sectionIndex + 1].title}</span>
                            <ArrowRightIcon className="hidden sm:block"/>
                        </Link>
                    )}
                </div>
                <div className="w-full mt-4 flex flex-row flex-wrap justify-center items-center print:hidden">
                    <Link href={`/notes/${note.slug}`} className="link flex">
                        <ListIcon />Back to {note.title}
                    </Link>
                </div>
            </div>
        </>
    );
}

export default SectionPage;