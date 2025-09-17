'use server';

import { NoteSection } from "./note-section-type";
import { parse } from 'node-html-parser';

const textToSlug = (text: string): string => {
    return text.replace(/,| \(.*\)/g, "")
        .replace(/Unit [0-9]: /g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
};

export const getNoteSections = async (mdx: string): Promise<NoteSection[]> => {
    const sections = mdx.split("\n<hr >\n");

    return sections.map((section) => {
        const [mdTitle, ...contentLines] = section.trim().split("\n");
        const content = contentLines.join("\n");

        const title = mdTitle.replace(/^#+ /, "");

        return {
            slug: textToSlug(title),
            title,
            content,
        };
    });
};

export const getHTMLNoteSections = async (html: string): Promise<NoteSection[]> => {
    let sectionId = 1;
    const output = html.replace(/<div class="el-h1 heading-wrapper">/g, () => {
        return `<div class="el-h1 heading-wrapper" id="section-heading-${sectionId++}">`;
    });

    const root = parse(output);
    const sections: NoteSection[] = [];

    let elements = root.querySelectorAll(".el-h1.heading-wrapper");
    if (!elements) return [];
    
    for (var i = 0; i < elements.length; i++) {
        const e = elements[i];
        let firstChild = e.querySelector("h1");
        if (!firstChild) continue;
        const title = firstChild.innerText.trim();
        if (!title) continue;

        firstChild.remove();

        let section = {
            title,
            slug: textToSlug(title),
            content: e.outerHTML
        };

        console.log(section.title + ", " + section.content.length);

        sections.push(section);
    };

    return sections;
};
