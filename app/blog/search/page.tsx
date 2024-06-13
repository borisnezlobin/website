import { PrimaryButton } from "@/components/buttons";
import { SearchBar } from "../[slug]/components";
import Link from "next/link";
import db from "@/app/lib/db";
import { Metadata } from "next";
import getMetadata from "@/app/lib/metadata";

export const metadata: Metadata = getMetadata({
  title: "Search My Blog",
  info: "@Rand0mLetterz on Twitter",
  description: "Search for articles on my blog",
});

const SearchPage = () => {
  const getRandomArticle = async () => {
    const posts = await db.article.findMany();
    const post = posts[Math.floor(Math.random() * posts.length)];
    return post;
  };

  /*
        I so cannot be bothered to make client/server boundary stuff rn
        onClick={async () => {
            const post = await getRandomArticle();
            window.location.href = "/blog/" + post.slug;
        }}
    */

  return (
    <div className="min-h-screen dark:bg-dark-background p-8 text-light-foreground dark:text-dark-foreground flex flex-col justify-center items-center">
      <h1 className="text-5xl edo">Search Blog</h1>
      <SearchBar />
      <div className="mt-4 flex flex-row justify-center items-center gap-2">
        <Link href="/blog" className="link" aria-label="Go to blog">
          Go to blog
        </Link>
        <p className="text-muted dark:text-muted-dark">or</p>
        <Link href="/blog/tags" className="link" aria-label="Explore tags">
          Explore articles
        </Link>
      </div>
      <PrimaryButton className="mt-4">Feeling lucky?</PrimaryButton>
    </div>
  );
};

export default SearchPage;
