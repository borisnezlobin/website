import getMetadata from "../../lib/metadata";
import { NotesListItem } from "./notes-list-item";
import { getNotes } from "../../lib/db-caches";

export const metadata = getMetadata({
    title: "Lecture Notes",
    subtitle: "Linear Algebra, AP Physics C, and more.",
    description: "A collection of notes I've taken for various courses. Linear Algebra, AP Physics C, and more.",
});

export const generateStaticParams = async () => {
    if (!process.env.POSTGRES_URL_NON_POOLING) return [];
    const slugs = await getNotes();

    console.log("Generating paths for notes:", slugs);
    return slugs.map((note) => ({ params: { slug: note.slug } }));
}

export default async function NotesPage() {
    const notes = await getNotes();

    return (
        <div className="pagepad">
            <h1 className="text-3xl font-bold emph">Lecture Notes</h1>
            <p className="mt-4">
                A collection of notes I&apos;ve taken for various courses. Linear Algebra, AP Physics C (to be published), and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 mt-8 md:mt-4">
                {notes.map((note) => note.slug.indexOf("draft") === -1 ? (
                    <NotesListItem key={note.slug} note={note} />
                ) : null)}
            </div>
        </div>
    );
}