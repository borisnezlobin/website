"use client";

import { IconButton, LinkButton } from "@/components/buttons";
import {
  HeartStraight,
  MagnifyingGlass,
  Share,
  XLogo,
} from "@phosphor-icons/react";
import { likePost } from "./actions";
import { useEffect, useState } from "react";
import { Article } from "@prisma/client";
import ArticleBody from "@/app/components/article-body";
import { DateAndLikes } from "../components/date-and-likes";
import BlogListItem from "../components/blog-list-item";
import LoadingEffect from "@/app/components/loading-or-content";
import EmptyPost from "@/app/utils/empty-post";
import NotFoundPage from "@/app/components/not-found-page";

const LikeButton = ({ slug }: { slug: string }) => {
  const [liked, setLiked] = useState(false);

  if (liked) {
    return (
      <div className="flex flex-row items-center p-2">
        <HeartStraight className="h-6 w-6 text-red-700" weight="fill" />
      </div>
    );
  }

  return (
    <IconButton
      onClick={() => {
        if (liked) return;
        likePost(slug);
        setLiked(true);
      }}
      icon={<HeartStraight className="h-6 w-6" />}
    />
  );
};

const ShareButton = () => {
  if (!navigator || !navigator.share) {
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
};

const TweetArticleButton = () => {
  return (
    <IconButton
      onClick={() => {
        window.open(
          "https://twitter.com/intent/tweet?text=" +
            encodeURIComponent("Check out this article by @Rand0mLetterz! ") +
            window.location,
        );
      }}
      icon={<XLogo className="h-6 w-6" />}
    />
  );
};

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
            <p className="!bg-transparent text-light dark:text-dark">Search</p>
          </>
        }
      />
    </form>
  );
};

const ArticleImageBg = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="absolute top-0 left-0 h-96 bg-transparent w-screen z-0">
      <div className="md:absolute h-full inset-0 bg-transparent">
        <img src={imageUrl} className="w-full h-full object-cover" />
      </div>
      <div className="hidden transition-all duration-300 md:block md:absolute bg-transparent dark:bg-transparent inset-0 bg-gradient-to-t from-light-background dark:from-dark-background to-transparent" />
    </div>
  );
};

export const ArticleWithAsync = ({
  postPromise,
  similarPostsPromise,
}: {
  postPromise: any;
  similarPostsPromise: any;
}) => {
  const [post, setPost] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [similarPosts, setSimilarPosts] = useState<Article[]>([]);

  useEffect(() => {
    if (!post) {
      postPromise.then((p: Article) => {
        setPost(p);
        setLoading(false);
        // searchPosts(post.tags[0].name).then((posts) => {
        //     setSimilarPosts(posts);
        // });
      });
    }
    if (!similarPosts.length) {
      similarPostsPromise.then((posts: Article[]) => {
        setSimilarPosts(posts);
      });
    }
  }, []);

  if(!post && !loading){
    return <NotFoundPage title="Blog post not found" />
  }

  const containerClass =
    "bg-light-background/30 dark:bg-dark-background/30 gap-3 rounded-lg backdrop-blur-lg ";

  return (
    <div className="min-h-screen dark:bg-dark-background z-[1] w-full pt-[26rem] p-8 md:pt-8 text-light-foreground dark:text-dark-foreground">
      {post && post.image && <ArticleImageBg imageUrl={post.image} />}
      <header
        className={
          containerClass +
          " z-[1] flex flex-col justify-start items-start md:items-center p-0 md:p-4"
        }
      >
        <h1 className="text-5xl bg-transparent dark:bg-transparent edo">
          <LoadingEffect
            text={post ? post.title : "loading..."}
            expectedLength="medium"
            loading={loading}
          />
        </h1>
        <DateAndLikes
          article={post || EmptyPost}
          className={`mt-2 bg-transparent dark:bg-transparent ${post && post.image ? "text-light dark:text-dark" : "text-muted dark:text-muted-dark"}`}
          containerClass="bg-transparent dark:bg-transparent"
        />
        <p className="bg-transparent dark:bg-transparent mt-2 mb-1 font-semibold">
          <LoadingEffect
            text={
              post
                ? post.description
                : "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            }
            expectedLength="short"
            loading={loading}
          />
        </p>
      </header>
      <div
        className={`z-[1] w-full justify-center flex items-center relative mt-2 mb-8 ${true ? "p-0 md:p-8" : ""} rounded-lg`}
      >
        <div
          className={`z-[1] max-w-3xl self-center relative mt-2 w-full mb-8 ${true ? "p-0 md:p-8" : ""} rounded-lg`}
        >
          <LoadingEffect
            className="z-[1] text-muted dark:text-muted-dark"
            // @ts-ignore
            text={post ? post.tags.map((tag) => tag.name).join(", ") : ""}
            loading={loading}
            expectedLength="short"
          />
          <br />
          <ArticleBody text={post ? post.body : undefined} />
        </div>
      </div>
      {post && (
        <div className="z-[1] flex flex-row justify-start items-center gap-2">
          <p className="text-muted dark:text-muted-dark">Liked this article?</p>
          <LikeButton slug={post.slug} />
          <ShareButton />
          <TweetArticleButton />
        </div>
      )}

      <LinkButton
        direction="left"
        aria-label="Back to Blog"
        className="mt-8"
        href="/blog"
      >
        Back to blog
      </LinkButton>

      <h2 className="text-3xl mt-12">More articles</h2>

      <div className="md:pl-8">
        <ul>
          {similarPosts.map((post) => (
            <li key={post.id}>
              {/* @ts-ignore */}
              <BlogListItem post={post} tags={post.tags} />
            </li>
          ))}
        </ul>
      </div>
      {/* @ts-ignore */}
      {post && post.tags.length > 0 && (
        // @ts-ignore
        <LinkButton
          className="mt-6 mb-16"
          // @ts-ignore
          href={`/blog/tag/${post.tags[0].slug}`}
        >
          View all
        </LinkButton>
      )}
    </div>
  );
};

export {
  LikeButton,
  ShareButton,
  TweetArticleButton,
  SearchBar,
  ArticleImageBg,
};
