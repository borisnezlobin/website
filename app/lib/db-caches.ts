import db from "./db";
import { unstable_cache } from "next/cache";

const getBlogs = unstable_cache(async () => {
    return await db.article.findMany({
        orderBy: { createdAt: "desc" },
    });
});

const getBlog = unstable_cache(async (slug: string) => {
    return db.article.findUnique({
        where: { slug },
    });
});

const getSimilarPosts = unstable_cache(async (slug: string) => {
    return await db.article.findMany({
        where: {
            NOT: {
                slug,
            },
        },
        take: 3,
    });
});

const getNotes = unstable_cache(async () => {
    return db.note.findMany();
});

const getNote = unstable_cache(async (slug: string) => {
    return db.note.findUnique({
        where: { slug },
    });
});

const getProjects = unstable_cache(async () => {
    return db.project.findMany();
});

const getProject = unstable_cache(async (slug: string) => {
    return db.project.findUnique({
        where: { slug },
    });
});

export {
    getBlogs,
    getBlog,
    getSimilarPosts,
    getNotes,
    getNote,
    getProjects,
    getProject,
};