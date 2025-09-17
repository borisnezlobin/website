import { MetadataRoute } from 'next'
import { getBlogs, getNotes, getProjects } from './lib/db-caches'
import { getNoteSections } from './(mywebsite)/notes/getNoteSections';
import getNoteMdxPath, { getNoteHTMLPath } from './utils/get-note-mdx-path';
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
    const noteSections = (
        await Promise.all(
            notes.flatMap(async (note) => {
            const sections = await getNoteSections(
                readFileSync(getNoteHTMLPath(note.slug), "utf-8")
            );

            console.log(note.title, "has", sections.length, "sections");

            return sections
                .map((section) => {
                if (section.slug.startsWith("draft") || note.slug.startsWith("draft")) {
                    return null;
                }
                return {
                    url: `https://www.borisn.dev/notes/${note.slug}/${section.slug}`,
                    lastModified: note.updatedAt,
                };
                })
                .filter(Boolean); // filter nulls right here
            })
        )
        ).flat().filter((section) => section !== null);


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

    console.log("Sitemap generated with", sitemap.length, "routes:");
    console.log(sitemap.map((route) => route ? route.url : ""));

    // this actually works (due to filters) and TS knows it so I can't use ts-expect-error, but for some reason vercel builds disagree
    // so ts-ignore it is
    // @ts-ignore
    return sitemap;
}