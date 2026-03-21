import { MetadataRoute } from 'next'
import { getBlogs, getNotes, getProjects } from './lib/db-caches'
import { getNoteSections } from './(mywebsite)/notes/getNoteSections';
import getNoteMdxPath, { getNoteHTMLPath } from './utils/get-note-mdx-path';
import { existsSync, readFileSync } from 'fs';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const blogs = await getBlogs();
    const blogRoutes = blogs.map((blog) => ({
        url: `https://www.borisnezlobin.com/blog/${blog.slug}`,
        lastModified: blog.updatedAt,
    }));

    const projects = await getProjects();
    const projectRoutes = projects
        .filter((project) => !project.slug.includes("draft-"))
        .map((project) => ({
            url: `https://www.borisnezlobin.com/projects/${project.slug}`,
            lastModified: project.updatedAt,
        }));

    const notes = await getNotes();
    const noteRoutes = notes
        .filter((note) => !note.slug.includes("draft-"))
        .map((note) => ({
            url: `https://www.borisnezlobin.com/notes/${note.slug}`,
            lastModified: note.updatedAt,
        }));

    const noteSections = (
        await Promise.all(
            notes.flatMap(async (note) => {
            if (note.slug.includes("draft-")) return [];
            const notePath = getNoteHTMLPath(note.slug);
            if (!existsSync(notePath)) return [];

            const sections = await getNoteSections(
                readFileSync(notePath, "utf-8")
            );

            console.log(note.title, "has", sections.length, "sections");

            return sections
                .map((section) => {
                if (section.slug.includes("draft-")) {
                    return null;
                }
                return {
                    url: `https://www.borisnezlobin.com/notes/${note.slug}/${section.slug}`,
                    lastModified: note.updatedAt,
                };
                })
                .filter(Boolean); // filter nulls right here
            })
        )
        ).flat().filter((section) => section !== null);


    const sitemap = [
        { url: 'https://www.borisnezlobin.com/' },
        { url: 'https://www.borisnezlobin.com/blog' },
        { url: 'https://www.borisnezlobin.com/contact' },
        { url: 'https://www.borisnezlobin.com/projects' },
        { url: 'https://www.borisnezlobin.com/notes' },
        { url: 'https://www.borisnezlobin.com/wrisk' },
        ...blogRoutes,
        ...projectRoutes,
        ...noteRoutes,
        ...noteSections,
    ];

    console.log("Sitemap generated with", sitemap.length, "routes:");
    console.log(sitemap.map((route) => route ? route.url : ""));

    // this actually works (due to filters) and TS knows it so I can't use ts-expect-error, but for some reason vercel builds disagree
    // so ts-ignore it is
    // @ts-ignore
    return sitemap;
}