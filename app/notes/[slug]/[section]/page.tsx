import db from "@/app/lib/db";
import { fstat, readFileSync } from "fs";
import { getNoteSections, getHTMLNoteSections } from "../../getNoteSections";
import ArticleBody from "@/app/components/article-body";
import Link from "next/link";
import { ArrowLeft, ArrowRight, List } from "@phosphor-icons/react/dist/ssr";
import getMetadata from "@/app/lib/metadata";
import NotFoundPage from "@/app/components/not-found-page";
import BackToRouteLink from "@/app/components/back-to-route";
import getNoteMdxPath, { getNoteHTMLPath } from "@/app/utils/get-note-mdx-path";
import { getNote, getNotes } from "@/app/lib/db-caches";
import { DraftBadge } from "@/app/components/draft-badge";
import { Wrapper } from "./skibidiwrapper";

export async function generateStaticParams() {
    const notes = await getNotes();

    return notes.flatMap((note) => {
        try {
            const sections = getNoteSections(readFileSync(getNoteMdxPath(note.slug), "utf-8"));
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

export async function generateMetadata({ params }: { params: { slug: string, section: string } }) {
    const note = await getNote(params.slug);

    if (!note) {
        return getMetadata({
            title: "Notes not found.",
            info: "404",
            subtitle: "Boris Nezlobin.",
            description:
                "The requested notes couldn't be found. Visit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    const sections = getNoteSections(readFileSync(getNoteMdxPath(note.slug), "utf-8"));
    const section = sections.find((section) => section.slug === params.section);

    if (!section) {
        return getMetadata({
            title: `Section not found.`,
            subtitle: note.title,
            info: "Boris Nezlobin.",
            description:
                `The requested section couldn't be found in my ${note.title} notes. Visit my website to contact me, see what I'm up to, and learn more about me!`,
        });
    }

    return getMetadata({
        title: `${section.title}`,
        subtitle: note.title,
        info: "Notes by Boris Nezlobin.",
        description: `Check out my ${section.title} notes on ${note.title}! ${note.description}. ${sections.length} sections. Made and published by Boris Nezlobin.`,
    });
}


const SectionPage = async ({ params }: { params: { slug: string, section: string }}) => {
    const note = await getNote(params.slug);

    if (!note) {
        return (
            <NotFoundPage title="Notes not found." />
        )
    }

    const configDirectory = getNoteHTMLPath(note.slug);
    const content = readFileSync(configDirectory, "utf-8");
    const sections = getHTMLNoteSections(content);

    const sectionIndex = sections.findIndex((section) => section.slug === params.section);

    if (sectionIndex === -1 && params.section !== "test") {
        return (
            <NotFoundPage title={`Section of ${note.title} not found.`} />
        )
    }

    let section = sections[sectionIndex];
    const isDraft = note.slug.startsWith("draft-") || section.slug.startsWith("draft-");

    return (
        <>
            {/* {isDraft && (<DraftBadge />)} */}
            <div className="min-h-[100svh] print:min-h-0 dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
                <div className="z-[1] max-w-2xl ml-auto mr-auto relative w-full p-0 md:p-8">
                    <header className="border-b border-muted dark:border-muted-dark mb-6 pb-6">
                        <BackToRouteLink href={`/notes/${note.slug}`} text={note.title} />
                        <h1 className="text-3xl font-bold mb-2 emph">{section.title}</h1>
                        <p className="text-muted dark:text-muted-dark mb-2">{sectionIndex + 1}/{sections.length} in {note.title}. <span><Link href={`/notes/${note.slug}`} className="link font-bold">See all</Link></span>.</p>
                    </header>
                    <Wrapper content={section.content} />
                </div>
                <div className="w-full flex flex-row flex-wrap justify-between items-center gap-4 pt-8 print:hidden">
                    {sectionIndex > 0 ? (
                        <Link href={`/notes/${note.slug}/${sections[sectionIndex - 1].slug}`} className="link">
                            <ArrowLeft className="hidden sm:block" />
                            <span className="sm:hidden">Prev: </span>
                            <span className="underline">{sections[sectionIndex - 1].title}</span>
                        </Link>
                    ) : (
                        <Link href={`/notes/${note.slug}`} className="link">
                            <ArrowLeft className="hidden sm:block" />
                            <span className="sm:hidden">Prev: </span>
                            <span className="underline">Table of Contents</span>
                        </Link>
                    )}
                    {sectionIndex < sections.length - 1 && (
                        <Link href={`/notes/${note.slug}/${sections[sectionIndex + 1].slug}`} className="link">
                            <span className="sm:hidden">Next: </span>
                            <span className="underline">{sections[sectionIndex + 1].title}</span>
                            <ArrowRight className="hidden sm:block"/>
                        </Link>
                    )}
                </div>
                <div className="w-full mt-4 flex flex-row flex-wrap justify-center items-center print:hidden">
                    <Link href={`/notes/${note.slug}`} className="link flex">
                        <List />Back to {note.title}
                    </Link>
                </div>
            </div>
        </>
    );
}

export default SectionPage;