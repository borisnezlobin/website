import db from "@/app/lib/db";
import { readFileSync } from "fs";
import path from "path";
import { getNoteSections } from "../../getNoteSections";
import ArticleBody from "@/app/components/article-body";

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

    const section = sections.find((section) => section.slug === params.section);

    if (!section) {
        return {
            notFound: true,
        };
    }

    return (
        <div className="min-h-screen dark:bg-dark-background z-[1] w-full p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
            <div className="z-[1] max-w-3xl ml-auto mr-auto relative w-full p-0 md:p-8">
                <h1 className="text-4xl font-bold mb-3">{section.title}</h1>
                <ArticleBody body={section.content} />
            </div>
        </div>
    );
}

export default SectionPage;