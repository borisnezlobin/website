import path from "path";

const getNoteMdxPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("mdx", "notes", slug.replaceAll("draft-", "") + ".mdx"));
}

const getNoteHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("mdx", "notes", slug.replaceAll("draft-", "") + ".html"));
}

const getBlogHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("mdx", "blog", slug.replaceAll("draft-", "") + ".html"));
}

const getProjectHTMLPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("mdx", "project", slug.replaceAll("draft-", "") + ".html"));
}

export default getNoteMdxPath;
export { getNoteHTMLPath, getBlogHTMLPath, getProjectHTMLPath };