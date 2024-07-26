import { visit } from "unist-util-visit";
import jsx from "refractor/lang/jsx";
import javascript from "refractor/lang/javascript";
import css from "refractor/lang/css";
import cssExtras from "refractor/lang/css-extras";
import jsExtras from "refractor/lang/js-extras";
import sql from "refractor/lang/sql";
import typescript from "refractor/lang/typescript";
import java from "refractor/lang/java";
import objectivec from "refractor/lang/objectivec";
import markdown from "refractor/lang/markdown";
import json from "refractor/lang/json";
import { refractor } from "refractor";
import { unified } from "unified";
import parse from "rehype-parse";
import remark2rehype from "remark-rehype";
import rehype2react from "rehype-react";
import { createElement, Fragment } from "react";

refractor.register(jsx);
refractor.register(json);
refractor.register(typescript);
refractor.register(javascript);
refractor.register(css);
refractor.register(cssExtras);
refractor.register(jsExtras);
refractor.register(sql);
refractor.register(java);
refractor.register(objectivec);
refractor.register(markdown);

refractor.alias({ jsx: ["js"] });

const getLanguage = (node: any) => {
    const className = node.properties.className || [];

    for (const classListItem of className) {
        if (classListItem.slice(0, 9) === "language-") {
            return classListItem.slice(9).toLowerCase();
        }
    }

    return null;
};

const nodeToString = (node: any): string => {
    if (node.type === 'text') {
        return node.value;
    }
    if (node.children) {
        return node.children.map(nodeToString).join('');
    }
    return '';
};

const rehypePrism = (options: any) => {
    options = options || {};

    return (tree: any) => {
        visit(tree, "element", visitor);
    };

    function visitor(node: any, index: any, parent: any) {
        if (!parent || parent.tagName !== "pre" || node.tagName !== "code") {
            return;
        }

        const lang = getLanguage(node);

        if (lang === null) {
            return;
        }

        let result;
        try {
            parent.properties.className = (parent.properties.className || []).concat(
                "language-" + lang
            );
            result = refractor.highlight(nodeToString(node), lang);
        } catch (err: any) {
            if (options.ignoreMissing && /Unknown language/.test(err.message)) {
                return;
            }
            throw err;
        }

        node.children = result;
    }
};

const processor = unified()
    .use(parse)
    .use(remark2rehype)
    // @ts-ignore
    .use(rehypePrism)
    // @ts-ignore
    .use(rehype2react, {
        createElement: createElement,
        Fragment: Fragment
    });

export { processor };