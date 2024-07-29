import { SearchBar } from "../[slug]/components";
import Link from "next/link";
import { Metadata } from "next";
import getMetadata from "@/app/lib/metadata";

export const metadata: Metadata = getMetadata({
  title: "Search My Blog",
  info: "@Rand0mLetterz on Twitter",
  description: "Search for articles on my blog",
});

const SearchPage = () => {
  return (
    <div className="min-h-[calc(100vh-3rem)] dark:bg-dark-background p-8 text-light-foreground dark:text-dark-foreground flex flex-col justify-center items-center">
      <h1 className="text-5xl edo">Search Blog</h1>
      <SearchBar />
      <div className="mt-4 flex flex-row justify-center items-center gap-2">
        <Link href="/blog" className="link font-semibold" aria-label="Go to blog">
          Go to blog
        </Link>
        <p className="text-muted dark:text-muted-dark">or</p>
        <Link href="/blog/tags" className="link font-semibold" aria-label="Explore tags">
          Explore articles
        </Link>
      </div>
    </div>
  );
};

export default SearchPage;
