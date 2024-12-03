import path from "path";

const getNoteMdxPath = (slug: string) => {
    return path.resolve(process.cwd(), path.join("mdx", "notes", slug.replaceAll("draft-", "") + ".mdx"));
}

export default getNoteMdxPath;