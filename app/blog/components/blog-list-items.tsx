"use client";

import { Article, Tag } from "@prisma/client";
import Link from "next/link";
import Badge from "../../components/badge";
import { DateAndLikes } from "./date-and-likes";
import TagBadge from "../tag/tag-badge";
import TagList from "../tag/tag-list";

const BlogListItem = ({
  post,
  tags = [],
  inGrid = false,
}: {
  post: Article;
  tags?: Tag[];
  inGrid: boolean;
}) => (
  <div
    key={post.id}
    className={`${!inGrid ? "mt-8 cursor-pointer group" : "flex flex-shrink-0 relative group cursor-pointer flex-col gap-2 h-48 min-2-96 w-96 p-4 border border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 hover:dark:border-neutral-400 group rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px"}`}
  >
    <Link
      href={`/blog/${post.slug}`}
      suppressHydrationWarning
      title={post.title}
    >
      <div className="flex flex-col gap-1 mb-2 md:flex-row justify-start items-start md:items-center md:gap-3 md:m-0">
        <h2 className="text-xl flex flex-row justify-start items-center">
          <p className="header-link">{post.title}</p>
        </h2>
        <TagList tags={tags} />
      </div>
      <p>{post.description}</p>
      <DateAndLikes
        article={post}
        className="sm:opacity-0 group-hover:opacity-100"
      />
    </Link>
  </div>
);

export default BlogListItem;
