import db from "@/app/lib/db";
import getMetadata from "@/app/lib/metadata";
import { LinkButton } from "@/components/buttons";
import { getNoteSections } from "../getNoteSections";

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const note = await db.note.findUnique({
        where: { slug: params.slug },
    });

    if (!note) {
        return getMetadata({
            title: "Notes not found.",
            info: "404",
            description:
                "The requested notes couldn't be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${note.title}`,
        description: note.description,
    });
}

export default async function SubjectNotesPage({ params }: { params: { slug: string } }) {
    const note = await db.note.findUnique({
        where: { slug: params.slug },
    });

    if (!note) {
        return {
            notFound: true,
        };
    }

    // oof code
    const content = await (await fetch(note.mdxURL)).text();
    const sections = getNoteSections(content);

    return (
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <h1 className="text-4xl font-bold">{note.title}</h1>
            <p className="mt-4">{note.description}</p>
            <LinkButton href={note.mdxURL}>Download the full Markdown</LinkButton>
            <hr />
            <div className="mt-8">
                {sections.map((section) => (
                    <div key={section.slug} className="mt-4">
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
}