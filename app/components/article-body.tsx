import { MDXRemote } from "next-mdx-remote/rsc";
import { GistEmbed } from "./mdx-components/gist-embed";
import MathEmbed from "./mdx-components/math-embed";
import Tweet from "./mdx-components/twitter-embed";

const ArticleBody = ({ body }: { body: string}) => {
    const parseBody = (body: string) => {
        let formattedBody = body.replaceAll("NEWLINE", "\n");

        // if we encounter $something$, we want to replace it with
        // <MathEmbed>{'something'}</MathEmbed>
        // if it's $$something$$, we want to replace it with
        // <MathEmbed display={true}>{'something'}</MathEmbed>

        formattedBody = formattedBody.replace(/\$\$([^$]+)\$\$/g, (_, match) => {
            let replaced = match.replaceAll("\n", ""); // THIS IS IMPORTANT (and silly) to stop the newlines from creating `p` tags
            replaced = replaced.replaceAll("\\", "\\\\");
            replaced = replaced.replaceAll("{", "\\{");
            return `<MathEmbed display={true}>${replaced}</MathEmbed>`;
        });

        formattedBody = formattedBody.replace(/\$([^$]+)\$/g, (_, match) => {
            let replaced = match.replaceAll("\\", "\\\\");
            replaced = replaced.replaceAll("{", "\\{");
            return `<MathEmbed>${replaced}</MathEmbed>`;
        });

        return formattedBody;
    }

    return <article>
        <MDXRemote source={`
            ${parseBody(body)}
        `} components={{ GistEmbed, MathEmbed, Tweet }} />
    </article>
};

export default ArticleBody;