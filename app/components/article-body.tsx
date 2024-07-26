import { MDXRemote } from "next-mdx-remote/rsc";
import { GistEmbed } from "./GistEmbed";

const ArticleBody = ({ body }: { body: string}) => (
    <article>
        <MDXRemote source={body.replaceAll("NEWLINE", "\n")} components={{ GistEmbed }} />
    </article>
);

export default ArticleBody;