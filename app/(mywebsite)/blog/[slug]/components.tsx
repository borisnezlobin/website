import { XLogo } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

const TweetArticleButton = ({ slug }: { slug: string }) => {
    return (
        <Link
            className="cursor-pointer p-2 hover:bg-light-foreground/20 dark:hover:bg-dark-foreground/20 rounded-lg bg-transparent text-light dark:text-dark"
            href={
                "https://twitter.com/intent/tweet?text=" +
                encodeURIComponent("Check out this article by @Rand0mLetterz! ") +
                encodeURIComponent("https://borisn.dev/blog/" + slug)
            }
            aria-label="Tweet this article"
            title="Tweet this article"
            target="_blank"
            rel="noopener noreferrer"
        >
            <XLogo className="h-6 w-6" />
        </Link>
    );
};

const ArticleImageBg = ({ imageUrl }: { imageUrl: string }) => {
    return (
        <div className="absolute top-[3rem] left-0 h-96 bg-transparent w-screen z-0 print:hidden">
            <div className="md:absolute h-full inset-0 bg-transparent">
                <img
                    alt="Article Image"
                    src={imageUrl}
                    className="w-screen h-96 object-cover z-[1] absolute top-[-4rem]"
                />
            </div>

        </div>
    );
};

export { TweetArticleButton, ArticleImageBg };
