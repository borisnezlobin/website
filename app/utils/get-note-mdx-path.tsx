import path from "path";

const getNoteMdxPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", slug + ".mdx"));
}

const getNoteHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "notes", slug + ".html"));
}

const getBlogHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "blog", slug + ".html"));
}

const getProjectHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("html", "project", slug + ".html"));
}

export default getNoteMdxPath;
export { getNoteHTMLPath, getBlogHTMLPath, getProjectHTMLPath };