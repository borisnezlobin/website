import { NoteSection } from "./note-section-type";

export const getNoteSections = (mdx: string): NoteSection[] => {
    const sections = mdx.split("\n<hr />\n");

    return sections.map((section) => {
        const [title, ...contentLines] = section.split("\n");
        const content = contentLines.join("\n");

        return {
            slug: title.replace("#", "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(),
            title,
            content,
        };
    });
}