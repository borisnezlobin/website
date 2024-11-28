import { MetadataRoute } from 'next'
import { getBlogs, getNotes, getProjects } from './lib/db-caches'
import { getNoteSections } from './notes/getNoteSections';
import getNoteMdxPath from './utils/get-note-mdx-path';
import { readFileSync } from 'fs';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const blogs = await getBlogs();
    const blogRoutes = blogs.map((blog) => {
        if (blog.slug.startsWith("draft")) {
            return null;
        } else return ({
            url: `https://www.borisn.dev/blog/${blog.slug}`,
            lastModified: blog.updatedAt,
        });
    }).filter((blog) => blog !== null);

    const projects = await getProjects();
    const projectRoutes = projects.map((project) => {
        if (project.slug.startsWith("draft")) {
            return null;
        } else return ({
            url: `https://www.borisn.dev/projects/${project.slug}`,
            lastModified: project.updatedAt,
        });
    }).filter((project) => project !== null);

    const notes = await getNotes();
    const noteRoutes = notes.map((note) => {
        if (note.slug.startsWith("draft")) {
            return null;
        } else return ({
            url: `https://www.borisn.dev/notes/${note.slug}`,
            lastModified: note.updatedAt,
        });
    }).filter((note) => note !== null);

    console.log()
    const noteSections = notes.flatMap((note) => {
        const sections = getNoteSections(readFileSync(getNoteMdxPath(note.slug), "utf-8"));
        console.log(note.title, "has", sections.length, "sections");
        return sections.map((section) => {
            if (section.slug.startsWith("draft") || note.slug.startsWith("draft")) {
                return null;
            } else return ({
                url: `https://www.borisn.dev/notes/${note.slug}/${section.slug}`,
                lastModified: note.updatedAt,
            })
        });
    }).filter((section) => section !== null);


    const sitemap = [
        { url: 'https://www.borisn.dev/' },
        { url: 'https://www.borisn.dev/blog' },
        { url: 'https://www.borisn.dev/contact' },
        { url: 'https://www.borisn.dev/projects' },
        { url: 'https://www.borisn.dev/notes' },
        ...blogRoutes,
        ...projectRoutes,
        ...noteRoutes,
        ...noteSections,
    ];

    // this actually works (due to filters) and TS knows it so I can't use ts-expect-error, but for some reason vercel builds disagree
    // so ts-ignore it is
    // @ts-ignore
    return sitemap;
}