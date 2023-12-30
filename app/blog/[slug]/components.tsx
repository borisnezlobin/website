"use client"

import { IconButton } from "@/components/buttons";
import { HeartStraight, MagnifyingGlass, Share, TwitterLogo } from "@phosphor-icons/react";
import { likePost, searchPosts } from "./actions";
import { useEffect, useRef, useState } from "react";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { highlightAll, highlightAllUnder } from "prismjs";

const LikeButton = ({ slug }: { slug: string }) => {
    const [liked, setLiked] = useState(false);

    if(liked){
        return (
            <div className="flex flex-row items-center p-2">
                <HeartStraight className="h-6 w-6 text-red-700" weight="fill" />
            </div>
        );
    }

    return (
        <IconButton
            onClick={() => {
                if(liked) return;
                likePost(slug);
                setLiked(true);
            }}
            icon={<HeartStraight className="h-6 w-6" />}
        />
    );
}

const ShareButton = () => {
    if(!navigator || !navigator.share){
        return null;
    }

    return (
        <IconButton
            onClick={() => {
                navigator.share({
                    title: "Check out this article by Boris Nezlobin!",
                    url: window.location.href,
                });
            }}
            icon={<Share className="h-6 w-6" />}
        />
    );
}

const TweetArticleButton = () => {
    return (
        <IconButton
            onClick={() => {
                window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent("Check out this article by @Rand0mLetterz! ") + window.location);
            }}
            icon={<TwitterLogo className="h-6 w-6" />}
        />
    );
}

const SearchBar = ({ query }: { query?: string }) => {
    const [search, setSearch] = useState(query || "");

    return (
        <form
            action={() => {
                window.location.href = "/blog/search/" + search;
            }}
            className="mt-4 flex w-full max-w-3xl flex-col items-start justify-center gap-2"
        >
            <input 
                type="text" 
                placeholder="Search"
                defaultValue={query}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 w-full bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground border border-light-foreground dark:border-dark-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-light-foreground dark:focus:ring-dark-foreground" 
            />
            <IconButton
                className="flex flex-row justify-center items-center gap-2 transition-all duration-300"
                icon={
                    <>
                        <MagnifyingGlass className="h-6 w-6" />
                        <p className="!bg-transparent text-light dark:text-dark">
                            Search
                        </p>
                    </>
                }
            />
        </form>
    );
}

const ArticleImageBg = ({ imageUrl }: { imageUrl: string }) => {
    return (
        <div className="absolute top-0 left-0 h-96 bg-transparent w-screen -z-10">
            <div className="md:absolute h-full inset-0 bg-transparent">
                <img
                    src={imageUrl}
                    alt="Article header"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="hidden transition-all duration-300 md:block md:absolute bg-transparent dark:bg-transparent inset-0 bg-gradient-to-t from-light-background dark:from-dark-background to-transparent" />
        </div>
    )
}

const ArticleBody = ({ text }: { text: string }) => {
    const [rendered, setRendered] = useState(false);
    const [textToRender, setTextToRender] = useState(text);
    const ref = useRef<HTMLElement | undefined>();

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
    }, [rendered, text]);

    // yeah
    return (
        // @ts-ignore
        <article ref={ref} dangerouslySetInnerHTML={{ __html: textToRender }} />
    );
}

export { LikeButton, ShareButton, TweetArticleButton, SearchBar, ArticleImageBg, ArticleBody };