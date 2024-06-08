import { Article } from "@prisma/client";
import { SearchBar } from "../[slug]/components";
import Link from "next/link";
import BlogListItem from "./blog-list-item";

const quotes = [
  {
    text: "We dream of a brand new start, but we dream in the dark for the most part.",
    source: "Aaron Burr, Hamilton"
  },
  {
    text: "I'll write my way out... write everything down far as I can see.",
    source: "Alexander Hamilton, Hamilton"
  },
  {
    text: "I love deadlines. I love the whooshing sound they make as they go by.",
    source: "Douglas Adams, The Salmon Of Doubt",
  },
  {
    text: "You never have to change anything you got up in the middle of the night to write.",
    source: "Saul Bellow"
  },
  {
    text: "Don't stop, be Lee, Ving. Hold on to that fee, Ling.",
    source: "4chan"
  },
  {
    text: "The road to hell is paved with adverbs.",
    source: "Stephen King"
  },
  {
    text: "Writing is just a socially acceptable form of schizophrenia.",
    source: "E.L. Doctrow"
  },
  {
    text: "pls hire me pls bro I swear bro",
    source: "Me, applying to Neuralink"
  },
  {
    text: "There are three rules for writing a novel. Unfortunately, no one knows what they are.",
    source: "W. Somerset Maughan"
  },
  {
    text: "Here is a lesson in creative writing. First rule: Do not use semicolons. They are transvestite hermaphrodites representing absolutely nothing. All they do is show you've been to college.",
    source: "Kurt Vonnegut, A Man Without a Country"
  },
  {
    text: "Ordinary life is pretty complex stuff.",
    source: "Harvey Pekar"
  }
];

const BlogList = ({
  articles,
  title,
  query = "",
}: {
  articles: Article[];
  title: string;
  query?: string;
}) => {
  const index = Math.floor(Math.random() * quotes.length);

  return (
    <div
      className="min-h-screen w-full p-8 text-light-foreground dark:text-dark-foreground"
      suppressHydrationWarning
    >
      <h1 className="text-5xl edo">{title ? title : "Blog"}</h1>
      <p className="mt-1 text-muted dark:text-muted-dark">
        Read my blog posts about software engineering, web development, and
        various thoughts that I put into article form! This is where I share much of what I do — projects, obsesrvations about modern society, and miscellaneous writings.
      </p>
      <SearchBar query={query} />
      <p className="mt-1 text-muted dark:text-muted-dark">
        {query && (
          <>
            <Link
              href="/blog"
              className="link font-semibold"
              title="Clear search"
            >
              Clear search
            </Link>
            <span className="text-muted dark:text-muted-dark">{" • "}</span>
          </>
        )}
        Showing {articles.length} post{articles.length == 1 ? " " : "s "}
        <span className="text-muted dark:text-muted-dark">{" • "}</span>
        <Link href="/blog/tags" className="link" aria-label="Explore tags">
          Explore all
        </Link>
      </p>
      <center className="w-full my-8 mb-12">
        <p>&quot;{quotes[index].text}&quot;</p>
        <p className="text-muted dark:text-muted-dark">— {quotes[index].source}</p>
      </center>
      {articles.map((post) => (
        // all my homies love
        // @ts-ignore
        <BlogListItem
          post={post}
          // @ts-ignore
          tags={post.tags ? post.tags : []}
          key={post.id}
        />
      ))}
    </div>
  );
};

export default BlogList;
