import { revalidatePath } from "next/cache";
import db from "../lib/db";
import getMetadata from "../lib/metadata";
import { NotesListItem } from "./notes-list-item";

export const metadata = getMetadata({
    title: "Lecture Notes",
    description: "A collection of notes I've taken for various courses. Linear Algebra, AP Physics, and more.",
});

export const generateStaticParams = async () => {
    const slugs = await db.note.findMany({
        select: { slug: true },
    });

    console.log("Generating paths for notes:", slugs);
    return slugs.map((note) => ({ params: { slug: note.slug } }));
}

export default async function NotesPage() {
    const notes = await db.note.findMany();

    if (!notes || notes.length === 0) {
        await seedNotes();
        revalidatePath("/notes");
    }

    return (
        <div className="min-h-[100svh] dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <h1 className="text-4xl font-bold">Lecture Notes</h1>
            <p className="mt-4">
                A collection of notes I&apos;ve taken for various courses. Linear Algebra, AP Physics, and more.
            </p>

            <div className="mt-8">
                {notes.map((note) => (
                    <NotesListItem key={note.slug} note={note} />
                ))}
            </div>
        </div>
    );
}


// temp:
async function seedNotes() {
    await db.note.create({
        data: {
            title: "AP Physics C: Mechanics",
            slug: "apc-mech",
            description: "Notes from the AP Physics C: Mechanics course, self-studied from Flipping Physics.",
            mdxURL: "https://raw.githubusercontent.com/borisnezlobin/website/main/notes/apc-mech.mdx",
        },
    });

    await db.note.create({
        data: {
            title: "Linear Algebra",
            slug: "linalg",
            mdxURL: "https://raw.githubusercontent.com/borisnezlobin/website/main/notes/linalg.mdx",
            description: "A combination of 3Blue1Brown's Essence of Linear Algebra and Stanford ULO's Linear Algebra course.",
        },
    });
}