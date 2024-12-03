import db from "./db";
import { unstable_cache } from "next/cache";

type AnyFunction = (...args: any[]) => any;

const wrapWithCache = <T extends AnyFunction>(fn: T): T => {
    if (process.env.NODE_ENV === "development") {
        return fn;
    }
    return unstable_cache(fn) as T;
}

const getBlogsWithoutCache = async () => {
    return await db.article.findMany({
        orderBy: { createdAt: "desc" },
        where: {
            slug: {
                not: {
                    startsWith: "draft",
                },
            }
        }
    });
}

const getBlogs = wrapWithCache(getBlogsWithoutCache);

const getBlogWithoutCache = async (slug: string) => {
    return db.article.findUnique({
        where: { slug },
    });
}

const getBlog = wrapWithCache(getBlogWithoutCache);

const getSimilarPostsWithoutCache = async (slug: string) => {
    return await db.article.findMany({
        where: {
            NOT: {
                slug,
            },
            slug: {
                not: {
                    startsWith: "draft",
                },
            },
        },
        take: 3,
    });
}

const getSimilarPosts = wrapWithCache(getSimilarPostsWithoutCache);

const getNotesWithoutCache = async () => {
    return db.note.findMany();
}

const getNotes = wrapWithCache(getNotesWithoutCache);

const getNoteWithoutCache = async (slug: string) => {
    return db.note.findUnique({
        where: { slug },
    });
}

const getNote = wrapWithCache(getNoteWithoutCache);

const getProjectsWithoutCache = async () => {
    return db.project.findMany({
        where: {
            slug: {
                not: {
                    startsWith: "draft",
                },
            }
        }
    });
};

const getProjects = wrapWithCache(getProjectsWithoutCache);

const getProjectWithoutCache = async (slug: string) => {
    return db.project.findUnique({
        where: { slug },
    });
}

const getProject = wrapWithCache(getProjectWithoutCache);

export {
    getBlogs,
    getBlog,
    getSimilarPosts,
    getNotes,
    getNote,
    getProjects,
    getProject,
};