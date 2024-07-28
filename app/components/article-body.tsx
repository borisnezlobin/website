import { MDXRemote } from "next-mdx-remote/rsc";
import { GistEmbed } from "./GistEmbed";
import MathEmbed from "./MathEmbed";
import Latex from 'react-latex-next';

const ArticleBody = ({ body }: { body: string}) => {
    const parseBody = (body: string) => {
        let formattedBody = body.replaceAll("NEWLINE", "\n");


        // replace all instances of `<` that aren't followed by a name in `components` with `&lt;`
        // this is to prevent React from rendering the tags

        formattedBody = formattedBody.replace(/<(?!\/?(GistEmbed|Latex))/g, "< ");
        formattedBody = formattedBody.replace(/<\/(?!GistEmbed|Latex)/g, "< ");


        // if we encounter $something$, we want to replace it with
        // <MathEmbed>{'something'}</MathEmbed>
        // if it's $$something$$, we want to replace it with
        // <MathEmbed display={true}>{'something'}</MathEmbed>

        formattedBody = formattedBody.replace(/\$\$([^$]+)\$\$/g, (_, match) => {
            let replaced = match.replaceAll("\n", ""); // THIS IS IMPORTANT (and silly)
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
        `} components={{ GistEmbed, MathEmbed }} />
    </article>
};

export default ArticleBody;