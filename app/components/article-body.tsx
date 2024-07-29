import { MDXRemote } from "next-mdx-remote/rsc";
import { GistEmbed } from "./mdx-components/gist-embed";
import MathEmbed from "./mdx-components/math-embed";
import Tweet from "./mdx-components/twitter-embed";
import Footnote from "./mdx-components/footnote";
import { AnchorHTMLAttributes } from "react";
import Script from "next/script";
import "../styles/light.css";
import "../styles/dark.css";
import "../styles/gist.css";

const ArticleBody = ({ body }: { body: string }) => {
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
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css"
            integrity="sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc"
            crossOrigin="anonymous"
        />
        <Script src="https://unpkg.com/prismjs@v1.x/components/prism-core.min.js"></Script>
        <Script src="https://unpkg.com/prismjs@v1.x/plugins/autoloader/prism-autoloader.min.js"></Script>
        <MDXRemote source={`
            ${parseBody(body)}
        `} components={{ GistEmbed, MathEmbed, Tweet, Footnote, a: NewTabLink }} />
    </article>
};

const NewTabLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children }) => {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default ArticleBody;