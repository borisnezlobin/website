A placeholder blog entry that allows me to continue procrastinating actually maintaining my blog. Treat the content of this file as a lorem ipsum.


# Notable Quotes

From Steinbeck's _Winter of Our Discontent_, there are three quotes that stick out to me. They are listed below.


> It's harder to give away fish than it is to catch them.
> 

This quote is great for motivating somebody to move forwards and work harder—worry about giving things away only once you have things to give away.

> 'You who handle poverty badly will handle riches equally badly.' And that is true. In poverty she is envious. In riches she may be a snob. Money does not change the sickness, only the symptoms.
> 
> Careful with wanting too much at a time—you may not need it or deserve it.
> 
> Strength and success - they are above morality, above criticism. It seems, then, that it is not what you do, but how you do it and what you call it. Is there a check in men, deep in them, that stops or punishes? There doesn't seem to be. The only punishment is for failure.
> 
> This is my favorite quote from any work of literature. It guides me to simply be succesful—after that, everything will shape itself to fit.
> 

## The presence of game theory in actors' decisions in _To Kill a Mockingbird_

A paper I wrote once was titled "Collusion and Moral Ambiguity in _To Kill a Mockingbird_: Exploring the Role of Game Theory in Achieving Ends." The paper was meant to be a 600-word reflection, and I turned it into a 1500-word paper analyzing the motives of characters on the stand. It turns out that achieving ends in Harper Lee's world requires a sacrifice of morals, but that over-sacrificing inevitably leads to the destruction of oneself.


## Implementation

Here is some code. It is from this website, may be outdated, and shouldn't be judged too harshly. This file is a placeholder.


````ts
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


export {
  LikeButton,
  ShareButton,
  TweetArticleButton,
  SearchBar,
  ArticleImageBg,
};
```
This file now exceeds 276 lines. That is annoying, because Prisma Studio does not support pasting in newlines. They must be added manually, so that is what I am off to do.
````
