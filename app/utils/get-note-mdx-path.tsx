import path from "path";

const slugToName = (slug: string) => {
    return slug.replaceAll("draft-", "").replaceAll("personal-", "");
}

const getNoteMdxPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", slugToName(slug) + ".mdx"));
}

const getNoteHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", slugToName(slug) + ".html"));
}

const getBlogHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "blog", slugToName(slug) + ".html"));
}

const getProjectHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "project", slugToName(slug) + ".html"));
}

export default getNoteMdxPath;
export { getNoteHTMLPath, getBlogHTMLPath, getProjectHTMLPath };