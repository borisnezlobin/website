"use client";

import { highlightAll } from "prismjs";
import { useEffect, useState } from "react";
import { remark } from "remark";
import remarkHtml from "remark-html";
import LoadingEffect from "./loading-or-content";

const ArticleBody = ({ text }: { text?: string }) => {
    const [rendered, setRendered] = useState(false);
    const [textToRender, setTextToRender] = useState(text);

    useEffect(() => {
        if(rendered){
            highlightAll();
        }
        
        const renderText = async () => {
            if(!text) return;
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

    if(text == null || !textToRender){
        return <LoadingEffect loading={true} text="Loading article..." expectedLength="article" />
    }

    return (
        <article dangerouslySetInnerHTML={{ __html: textToRender }} />
    );
}


export default ArticleBody;