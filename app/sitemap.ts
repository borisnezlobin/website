import { MetadataRoute } from 'next'
import { getBlogs, getNotes, getProjects } from './lib/db-caches'
import { getNoteSections } from './notes/getNoteSections';
import getNoteMdxPath from './utils/get-note-mdx-path';
import { readFileSync } from 'fs';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const blogs = await getBlogs();
    const blogRoutes = blogs.map((blog) => ({
        url: `https://borisn.dev/blog/${blog.slug}`,
        lastModified: blog.updatedAt,
    }));

    const projects = await getProjects();
    const projectRoutes = projects.map((project) => ({
        url: `https://borisn.dev/projects/${project.slug}`,
        lastModified: project.updatedAt,
    }));

    const notes = await getNotes();
    const noteRoutes = notes.map((note) => ({
        url: `https://borisn.dev/notes/${note.slug}`,
        lastModified: note.updatedAt,
    }));

    const noteSections = notes.flatMap((note) => {
        const content = readFileSync(getNoteMdxPath(note.slug), 'utf-8');
        const sections = getNoteSections(content);
        return sections.map((section) => ({
            url: `https://borisn.dev/notes/${note.slug}/${section.slug}`,
            lastModified: note.updatedAt,
        }));
    });


    const sitemap = [
        { url: 'https://borisn.dev/' },
        { url: 'https://borisn.dev/blog' },
        { url: 'https://borisn.dev/contact' },
        { url: 'https://borisn.dev/projects' },
        { url: 'https://borisn.dev/notes' },
        ...blogRoutes,
        ...projectRoutes,
        ...noteRoutes,
    ];

    console.log('Generated sitemap:', sitemap);

    return sitemap;
}