import db from "@/app/lib/db";
import getMetadata from "@/app/lib/metadata";
import { getNoteSections, getHTMLNoteSections } from "../getNoteSections";
import { readFileSync } from "fs";
import Link from "next/link";
import NotFoundPage from "@/app/components/not-found-page";
import BackToRouteLink from "@/app/components/back-to-route";
import getNoteMdxPath, { getNoteHTMLPath } from "@/app/utils/get-note-mdx-path";
import { getNote, getNotes } from "@/app/lib/db-caches";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const note = await getNote(slug);

    if (!note) {
        return getMetadata({
            title: "Notes not found.",
            info: "404",
            subtitle: "Boris Nezlobin.",
            description:
                "The requested notes couldn't be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${note.title}`,
        subtitle: "Notes by Boris Nezlobin.",
        description: note.description + ". Made and published by Boris Nezlobin.",
    });
}

export async function generateStaticParams() {
    if (!process.env.POSTGRES_URL_NON_POOLING) return [];
    const notes = await getNotes();

    return notes.map((note) => ({ params: { slug: note.slug } }));
}

export default async function SubjectNotesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const note = await getNote(slug);

    if (!note) {
        return (
            <NotFoundPage title="Notes not found." />
        )
    }

    const configDirectory = getNoteHTMLPath(note.slug);
    console.log(configDirectory);
    const content = readFileSync(configDirectory, "utf-8"); // TODO: make this cached
    const sections = await getHTMLNoteSections(content);

    const numWords = content.split(/\s+/).length;

    return (
        <div className="pagepad">
            <BackToRouteLink href="/notes" text="Back to Notes" />
            <h1 className="text-3xl font-bold emph pt-4">{note.title}</h1>
            {/* <p className="mt-6 text-muted dark:text-muted-dark">Roughly {numWords} words.</p> */}
            <p className="mt-6">{note.description}</p>
            <div className="h-px w-full !bg-muted-dark dark:!bg-muted my-8" />
            <h2 className="text-2xl font-bold">Table of Contents</h2>
            <ol className="pl-8">
                {sections.map((section, i) => (
                    <div key={section.slug}>
                        <li className="mt-4">
                            <Link className="link" href={`/notes/${note.slug}/${section.slug}`}>
                                <span className="text-lg font-bold">{section.title}</span>
                            </Link>
                        </li>
                    </div>
                ))}
            </ol>
        </div>
    );
}