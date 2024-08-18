import { NoteSection } from "./note-section-type";

export const getNoteSections = (mdx: string): NoteSection[] => {
    const sections = mdx.split("\n<hr >\n");

    return sections.map((section) => {
        const [mdTitle, ...contentLines] = section.trim().split("\n");
        const content = contentLines.join("\n");

        const title = mdTitle.replace(/^#+ /, "");

        return {
            slug: title.replace(/,| \(.*\)/g, "").replace(/Unit [0-9]: /g, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(),
            title,
            content,
        };
    });
}