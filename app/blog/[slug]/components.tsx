"use client";

import { IconButton } from "@/components/buttons";
import {
  HeartStraight,
  MagnifyingGlass,
  Share,
  XLogo,
} from "@phosphor-icons/react";
import { likePost } from "./actions";
import { useEffect, useState } from "react";
import Image from "next/image";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !navigator.share) {
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
      className="mt-4 flex w-full max-w-2xl flex-row items-center justify-start gap-2 flex-wrap print:hidden"
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
    <div className="absolute top-[3rem] left-0 h-96 bg-transparent w-screen z-0 print:hidden">
      <div className="md:absolute h-full inset-0 bg-transparent">
        <Image alt="Article Image" src={imageUrl} className="w-full h-full object-cover" />
      </div>
      <div className="hidden transition-all duration-300 md:block md:absolute bg-transparent dark:bg-transparent inset-0 bg-gradient-to-t from-light-background dark:from-dark-background to-transparent" />
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
