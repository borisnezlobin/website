import db from "@/app/lib/db";
import getMetadata from "@/app/lib/metadata";
import { getNoteSections } from "../getNoteSections";
import { readFileSync } from "fs";
import Link from "next/link";
import NotFoundPage from "@/app/components/not-found-page";
import BackToRouteLink from "@/app/components/back-to-route";
import getNoteMdxPath from "@/app/utils/get-note-mdx-path";
import { getNote, getNotes } from "@/app/lib/db-caches";

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const note = await getNote(params.slug);

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
    const notes = await getNotes();

    return notes.map((note) => ({ params: { slug: note.slug } }));
}

export default async function SubjectNotesPage({ params }: { params: { slug: string } }) {
    const note = await getNote(params.slug);

    if (!note) {
        return (
            <NotFoundPage title="Notes not found." />
        )
    }

    const configDirectory = getNoteMdxPath(note.slug);
    const content = readFileSync(configDirectory, "utf-8"); // TODO: make this cached
    const sections = getNoteSections(content);

    const numWords = content.split(/\s+/).length;

    return (
        <div className="min-h-[100svh] print:min-h-0 dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <BackToRouteLink href="/notes" text="Back to Notes" />
            <h1 className="text-3xl font-bold emph pt-4">{note.title}</h1>
            <p className="mt-6 text-muted dark:text-muted-dark">Roughly {numWords} words.</p>
            <p>{note.description}</p>
            <hr className="my-8" />
            <h2 className="text-2xl font-bold">Table of Contents</h2>
            <ol>
                {sections.map((section, i) => (
                    <div key={section.slug}>
                        <Link className="link" href={`/notes/${note.slug}/${section.slug}`}>
                            <li className="mt-4">
                                {i + 1}. <span className="text-lg font-bold">{section.title}</span>
                            </li>
                        </Link>
                    </div>
                ))}
            </ol>
        </div>
    );
}