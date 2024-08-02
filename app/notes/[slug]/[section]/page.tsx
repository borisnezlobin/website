import db from "@/app/lib/db";
import { readFileSync } from "fs";
import path from "path";
import { getNoteSections } from "../../getNoteSections";
import ArticleBody from "@/app/components/article-body";
import Link from "next/link";
import { ArrowLeft, ArrowRight, List } from "@phosphor-icons/react/dist/ssr";

const SectionPage = async ({ params }: { params: { slug: string, section: string }}) => {
    const note = await db.note.findUnique({
        where: { slug: params.slug },
    });

    if (!note) {
        return {
            notFound: true,
        };
    }

    // oof code
    // const content = await (await fetch(note.mdxURL)).text();
    const configDirectory = path.resolve(process.cwd(), path.join("notes", note.slug + ".mdx"));
    const content = readFileSync(configDirectory, "utf-8");
    const sections = getNoteSections(content);

    const sectionIndex = sections.findIndex((section) => section.slug === params.section);

    if (sectionIndex === -1) {
        return {
            notFound: true,
        };
    }

    const section = sections[sectionIndex];

    return (
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <div className="z-[1] max-w-3xl ml-auto mr-auto relative w-full p-0 md:p-8">
                <header className="border-b border-muted dark:border-muted-dark mb-6 pb-6">
                    <p>{note.title}</p>
                    <h1 className="text-4xl font-bold mb-8">{section.title}</h1>
                    <p className="text-muted dark:text-muted-dark mb-2">{sectionIndex + 1}/{sections.length} in {note.title}. <span><Link href={`/notes/${note.slug}`} className="link font-bold">See all</Link></span>.</p>
                </header>
                <ArticleBody body={section.content} />
            </div>
            <div className="w-full flex flex-row flex-wrap justify-between items-center gap-4 pt-8">
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
            <div className="w-full mt-4 flex flex-row flex-wrap justify-center items-center">
                <Link href={`/notes/${note.slug}`} className="link flex">
                    <List />Back to {note.title}
                </Link>
            </div>
        </div>
    );
}

export default SectionPage;