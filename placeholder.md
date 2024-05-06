A placeholder blog entry that allows me to continue procrastinating actually maintaining my blog. Treat the content of this file as a lorem ipsum.\n
\n

# Notable Quotes\n

From Steinbeck's _Winter of Our Discontent_, there are three quotes that stick out to me. They are listed below.\n
\n

> It's harder to give away fish than it is to catch them.\n
> \n

This quote is great for motivating somebody to move forwards and work harder—worry about giving things away only once you have things to give away.\n

> 'You who handle poverty badly will handle riches equally badly.' And that is true. In poverty she is envious. In riches she may be a snob. Money does not change the sickness, only the symptoms.\n
> \n
> Careful with wanting too much at a time—you may not need it or deserve it.\n
> \n
> Strength and success - they are above morality, above criticism. It seems, then, that it is not what you do, but how you do it and what you call it. Is there a check in men, deep in them, that stops or punishes? There doesn't seem to be. The only punishment is for failure.\n
> \n
> This is my favorite quote from any work of literature. It guides me to simply be succesful—after that, everything will shape itself to fit.\n
> \n

## The presence of game theory in actors' decisions in _To Kill a Mockingbird_\n

A paper I wrote once was titled "Collusion and Moral Ambiguity in _To Kill a Mockingbird_: Exploring the Role of Game Theory in Achieving Ends." The paper was meant to be a 600-word reflection, and I turned it into a 1500-word paper analyzing the motives of characters on the stand. It turns out that achieving ends in Harper Lee's world requires a sacrifice of morals, but that over-sacrificing inevitably leads to the destruction of oneself.\n
\n

## Implementation\n

Here is some code. It is from this website, may be outdated, and shouldn't be judged too harshly. This file is a placeholder.\n
\n

````ts\n
"use client";\n
\n
import { IconButton, LinkButton } from "@/components/buttons";\n
import {\n
  HeartStraight,\n
  MagnifyingGlass,\n
  Share,\n
  XLogo,\n
} from "@phosphor-icons/react";\n
import { likePost } from "./actions";\n
import { useEffect, useState } from "react";\n
import { Article } from "@prisma/client";\n
import ArticleBody from "@/app/components/article-body";\n
import { DateAndLikes } from "../components/date-and-likes";\n
import BlogListItem from "../components/blog-list-item";\n
import LoadingEffect from "@/app/components/loading-or-content";\n
import EmptyPost from "@/app/utils/empty-post";\n
\n
const LikeButton = ({ slug }: { slug: string }) => {\n
  const [liked, setLiked] = useState(false);\n
\n
  if (liked) {\n
    return (\n
      <div className="flex flex-row items-center p-2">\n
        <HeartStraight className="h-6 w-6 text-red-700" weight="fill" />\n
      </div>\n
    );\n
  }\n
\n
  return (\n
    <IconButton\n
      onClick={() => {\n
        if (liked) return;\n
        likePost(slug);\n
        setLiked(true);\n
      }}\n
      icon={<HeartStraight className="h-6 w-6" />}\n
    />\n
  );\n
};\n
\n
const ShareButton = () => {\n
  if (!navigator || !navigator.share) {\n
    return null;\n
  }\n
\n
  return (\n
    <IconButton\n
      onClick={() => {\n
        navigator.share({\n
          title: "Check out this article by Boris Nezlobin!",\n
          url: window.location.href,\n
        });\n
      }}\n
      icon={<Share className="h-6 w-6" />}\n
    />\n
  );\n
};\n
\n
const TweetArticleButton = () => {\n
  return (\n
    <IconButton\n
      onClick={() => {\n
        window.open(\n
          "https://twitter.com/intent/tweet?text=" +\n
            encodeURIComponent("Check out this article by @Rand0mLetterz! ") +\n
            window.location,\n
        );\n
      }}\n
      icon={<XLogo className="h-6 w-6" />}\n
    />\n
  );\n
};\n
\n
const SearchBar = ({ query }: { query?: string }) => {\n
  const [search, setSearch] = useState(query || "");\n
\n
  return (\n
    <form\n
      action={() => {\n
        window.location.href = "/blog/search/" + search;\n
      }}\n
      className="mt-4 flex w-full max-w-3xl flex-col items-start justify-center gap-2"\n
    >\n
      <input\n
        type="text"\n
        placeholder="Search"\n
        defaultValue={query}\n
        onChange={(e) => setSearch(e.target.value)}\n
        className="p-2 w-full bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground border border-light-foreground dark:border-dark-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-light-foreground dark:focus:ring-dark-foreground"\n
      />\n
      <IconButton\n
        className="flex flex-row justify-center items-center gap-2 transition-all duration-300"\n
        icon={\n
          <>\n
            <MagnifyingGlass className="h-6 w-6" />\n
            <p className="!bg-transparent text-light dark:text-dark">Search</p>\n
          </>\n
        }\n
      />\n
    </form>\n
  );\n
};\n
\n
const ArticleImageBg = ({ imageUrl }: { imageUrl: string }) => {\n
  return (\n
    <div className="absolute top-0 left-0 h-96 bg-transparent w-screen z-0">\n
      <div className="md:absolute h-full inset-0 bg-transparent">\n
        <img src={imageUrl} className="w-full h-full object-cover" />\n
      </div>\n
      <div className="hidden transition-all duration-300 md:block md:absolute bg-transparent dark:bg-transparent inset-0 bg-gradient-to-t from-light-background dark:from-dark-background to-transparent" />\n
    </div>\n
  );\n
};\n
\n
\n
export {\n
  LikeButton,\n
  ShareButton,\n
  TweetArticleButton,\n
  SearchBar,\n
  ArticleImageBg,\n
};\n
```\n
This file now exceeds 276 lines. That is annoying, because Prisma Studio does not support pasting in newlines. They must be added manually, so that is what I am off to do.\n
````
