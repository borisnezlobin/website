import { parse } from "node-html-parser";

const NOISE_SELECTORS = "script, style, noscript, svg, nav, footer, header, form, iframe, template";

export type PageText = { title: string; description: string; text: string };

export function collapseWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

export function htmlToPlainText(html: string): string {
    const root = parse(html);
    root.querySelectorAll(NOISE_SELECTORS).forEach((node) => node.remove());
    return collapseWhitespace(root.structuredText);
}

export function readPageText(html: string): PageText {
    const root = parse(html);
    const title = collapseWhitespace(root.querySelector("title")?.textContent ?? "");
    const description =
        root.querySelector('meta[name="description"]')?.getAttribute("content") ??
        root.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
        "";
    return { title, description: collapseWhitespace(description), text: htmlToPlainText(html) };
}

export function unescapeHtmlEntities(text: string): string {
    return text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&");
}

function readMarkdownText(body: string): PageText {
    const lines = body.split("\n").map((line) => line.trim());
    const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") ?? "";
    const description = lines.find((line) => line.length > 40 && !/^[#>*\-|[!]/.test(line)) ?? "";
    const text = collapseWhitespace(body.replace(/[#*_>`|]|\]\([^)]*\)|\[/g, " "));
    return { title, description: collapseWhitespace(description), text };
}

/** Some sites answer non-browser clients with Markdown or plain text instead of HTML. */
export function readDocumentText(body: string, contentType: string): PageText {
    const isHtml = /html/i.test(contentType) || (!contentType && /<html|<body|<title/i.test(body));
    return isHtml ? readPageText(body) : readMarkdownText(body);
}
