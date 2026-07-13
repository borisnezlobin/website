import { ArticleCategory } from "@/prisma/awooga/client";

// Single source of truth for how article categories map to/from the ?category= URL param.
// Shared by the Writing page (server), the category tabs (client), and article back-links.

export const DEFAULT_CATEGORY: ArticleCategory = "TECHNICAL";
export const WRITING_CATEGORY_KEY = "writing-category";

const PARAM_TO_CATEGORY: Record<string, ArticleCategory> = {
    technical: "TECHNICAL",
    creative: "CREATIVE",
    personal: "PERSONAL",
};

// ?category= param → category enum, falling back to the default for anything unrecognised.
export const paramToCategory = (param?: string | null): ArticleCategory =>
    PARAM_TO_CATEGORY[(param ?? "").toLowerCase()] ?? DEFAULT_CATEGORY;

// category enum → ?category= param.
export const categoryToParam = (category: ArticleCategory): string => category.toLowerCase();

// The Writing URL for a category — the default is the bare route, the rest carry the param.
export const writingHref = (category: ArticleCategory): string =>
    category === DEFAULT_CATEGORY ? "/writing" : `/writing?category=${categoryToParam(category)}`;
