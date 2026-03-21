import path from "path";

// Notes and projects still use slug-prefixed DB entries (draft-, personal-)
// so we strip those before mapping to filenames. Blog slugs are already clean.
const stripSlugPrefixes = (slug: string) => {
    return slug.replace(/^draft-/, "").replace(/^personal-/, "");
}

const getNoteMdxPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", stripSlugPrefixes(slug) + ".mdx"));
}

const getNoteHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", stripSlugPrefixes(slug) + ".html"));
}

const getBlogHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "blog", slug + ".html"));
}

const getProjectHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "project", stripSlugPrefixes(slug) + ".html"));
}

export default getNoteMdxPath;
export { getNoteHTMLPath, getBlogHTMLPath, getProjectHTMLPath };