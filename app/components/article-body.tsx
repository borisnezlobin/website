"use client";

import { highlightAll } from "prismjs";
import { useEffect, useState } from "react";
import { remark } from "remark";
import remarkHtml from "remark-html";

const ArticleBody = ({ text }: { text: string }) => {
    const [rendered, setRendered] = useState(false);
    const [textToRender, setTextToRender] = useState(text);

    useEffect(() => {
        if(rendered){
            highlightAll();
        }
        
        const renderText = async () => {
            setTextToRender(await remark()
                .use(remarkHtml)
                .process(
                    text
                    .replaceAll(/\\n/g, "\n")
                    .replaceAll(/\\t/g, "\t")
                )
                .then((content) => content.toString())
            );
            setRendered(true);
        }

        renderText();
    }, [rendered, textToRender, text]);

    return (
        <article dangerouslySetInnerHTML={{ __html: textToRender }} />
    );
}


export default ArticleBody;