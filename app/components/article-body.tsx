import { MDXRemote } from 'next-mdx-remote/rsc';
import { GistEmbed } from './mdx-components/gist-embed';
import MathEmbed from './mdx-components/math-embed';
import Tweet from './mdx-components/twitter-embed';
import Footnote from './mdx-components/footnote';
import { AnchorHTMLAttributes, TableHTMLAttributes } from 'react';
import '../styles/gist.css';

const ArticleBody = ({ body }: { body: string }) => {
    const parseBody = (body: string) => {
        let formattedBody = body.replaceAll('NEWLINE', '\n');

        formattedBody = formattedBody.replace(/\$\$([^$]+)\$\$/g, (_, match) => {
        let replaced = match.replaceAll('\n', '');
            replaced = replaced.replaceAll('\\', '\\\\');
            replaced = replaced.replaceAll('{', '\\{').replaceAll('_', '\\_');
            return `<MathEmbed display={true}>${replaced}</MathEmbed>`;
        });

        formattedBody = formattedBody.replace(/\$([^$]+)\$/g, (_, match) => {
            let replaced = match.replaceAll('\\', '\\\\');
            replaced = replaced.replaceAll('{', '\\{').replaceAll('_', '\\_');
            return `<MathEmbed>${replaced}</MathEmbed>`;
        });

        return formattedBody;
    };

    return (
        <article>
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css"
                integrity="sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc"
                crossOrigin="anonymous"
            />
            <MDXRemote
                source={parseBody(body)}
                components={{ GistEmbed, MathEmbed, Tweet, Footnote, a: NewTabLink, table: TableContainer }}
            />
        </article>
    );
};

const NewTabLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children }) => {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
};

const TableContainer: React.FC<TableHTMLAttributes<HTMLTableElement>> = ({ children }: { children?: React.ReactNode }) => {
    return <div className="table-container">{children}</div>;
}

export default ArticleBody;