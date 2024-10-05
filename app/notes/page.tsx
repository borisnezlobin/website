import { revalidatePath } from "next/cache";
import db from "../lib/db";
import getMetadata from "../lib/metadata";
import { NotesListItem } from "./notes-list-item";
import { getNotes } from "../lib/db-caches";

export const metadata = getMetadata({
    title: "Lecture Notes",
    subtitle: "Linear Algebra, AP Physics C, and more.",
    description: "A collection of notes I've taken for various courses. Linear Algebra, AP Physics C, and more.",
});

export const generateStaticParams = async () => {
    const slugs = await getNotes();

    console.log("Generating paths for notes:", slugs);
    return slugs.map((note) => ({ params: { slug: note.slug } }));
}

export default async function NotesPage() {
    const notes = await getNotes();

    return (
        <div className="min-h-[100svh] print:min-h-0 dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <h1 className="text-3xl font-bold emph">Lecture Notes</h1>
            <p className="mt-4">
                A collection of notes I&apos;ve taken for various courses. Linear Algebra, AP Physics C, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 mt-8 md:mt-4">
                {notes.map((note) => (
                    <NotesListItem key={note.slug} note={note} />
                ))}
            </div>
        </div>
    );
}