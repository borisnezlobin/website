import db from "./db";
import { unstable_cache } from "next/cache";
import { buildPhotoFeed, serializeSeries, serializeSeriesSummary } from "./photo-feed";
import type { PhotoFeed, Series, SeriesSummary } from "./photo-types";

type AnyFunction = (...args: any[]) => any;

const wrapWithCache = <T extends AnyFunction>(fn: T, tags?: string[]): T => {
    if (process.env.NODE_ENV === "development") {
        return fn;
    }
    return unstable_cache(fn, undefined, tags ? { tags } : undefined) as T;
}

const getBlogsWithoutCache = async () => {
    return await db.article.findMany({
        orderBy: { createdAt: "desc" },
        where: { isDraft: false },
    });
}

const getBlogs = wrapWithCache(getBlogsWithoutCache);

const getPhotographsWithoutCache = async () => {
    return await db.photograph.findMany({
        orderBy: { likes: "desc" },
        where: {
            slug: {
                not: {
                    startsWith: "draft-",
                },
            }
        }
    });
}

const getPhotographs = wrapWithCache(getPhotographsWithoutCache, ["photos"]);

const getPhotoFeedWithoutCache = async (): Promise<PhotoFeed> => {
    const [photos, categories, series] = await Promise.all([
        db.photograph.findMany({
            orderBy: { likes: "desc" },
            where: {
                slug: { not: { startsWith: "draft-" } },
            },
            include: {
                categories: { select: { slug: true } },
            },
        }),
        db.category.findMany({
            orderBy: { label: "asc" },
            include: { _count: { select: { photos: true } } },
        }),
        db.series.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { photos: true } },
                photos: {
                    take: 2,  // cover + one peeking behind for the canvas stack
                    orderBy: { position: "asc" },
                    include: {
                        photo: { include: { categories: { select: { slug: true } } } },
                    },
                },
            },
        }),
    ]);
    return buildPhotoFeed(photos as any, categories as any, series as any);
};

const getPhotoFeed = wrapWithCache(getPhotoFeedWithoutCache, ["photos"]);

const getBlogWithoutCache = async (slug: string) => {
    return db.article.findUnique({
        where: { slug },
    });
}

const getBlog = wrapWithCache(getBlogWithoutCache);

const getSimilarPostsWithoutCache = async (slug: string) => {
    return await db.article.findMany({
        where: {
            NOT: { slug },
            isDraft: false,
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
                    startsWith: "draft-",
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

const getPhotographsCountWithoutCache = async () => {
    return await db.photograph.count({
        where: {
            slug: {
                not: {
                    startsWith: "draft-",
                },
            }
        }
    });
}

const getPhotographsCount = wrapWithCache(getPhotographsCountWithoutCache);

const getPhotographsPaginatedWithoutCache = async (skip: number, take: number) => {
    return await db.photograph.findMany({
        orderBy: { likes: "desc" },
        where: {
            slug: {
                not: {
                    startsWith: "draft-",
                },
            }
        },
        skip,
        take,
    });
}

const getPhotographsPaginated = wrapWithCache(getPhotographsPaginatedWithoutCache);

const getSeriesBySlugWithoutCache = async (slug: string): Promise<Series | null> => {
    const row = await db.series.findUnique({
        where: { slug },
        include: {
            photos: {
                orderBy: { position: "asc" },
                include: {
                    photo: {
                        include: { categories: { select: { slug: true } } },
                    },
                },
            },
        },
    });
    if (!row) return null;
    return serializeSeries(row as any);
};

const getSeriesBySlug = (slug: string) => {
    if (process.env.NODE_ENV === "development") return getSeriesBySlugWithoutCache(slug);
    return unstable_cache(getSeriesBySlugWithoutCache, ["series", slug], { tags: ["series", `series-${slug}`] })(slug);
};

const getAllSeriesSummariesWithoutCache = async (): Promise<SeriesSummary[]> => {
    const rows = await db.series.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { photos: true } } },
    });
    return rows.map((r: any) => serializeSeriesSummary(r));
};

const getAllSeriesSummaries = wrapWithCache(getAllSeriesSummariesWithoutCache, ["series"]);

export {
    getBlogs,
    getBlog,
    getSimilarPosts,
    getNotes,
    getNote,
    getProjects,
    getProject,
    getPhotographs,
    getPhotographsCount,
    getPhotographsPaginated,
    getPhotoFeed,
    getSeriesBySlug,
    getAllSeriesSummaries,
};