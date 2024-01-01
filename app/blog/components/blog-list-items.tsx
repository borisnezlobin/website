"use client"

import { Article, Tag } from "@prisma/client";
import Link from "next/link";
import Badge from "../../components/badge";
import { DateAndLikes } from "./date-and-likes";
import TagBadge from "../tag/tag-badge";
import TagList from "../tag/tag-list";

const BlogListItem = ({ post, tags = [] } : { post: Article, tags?: Tag[] }) => (
    <div key={post.id} className="mt-8 cursor-pointer group">
        <Link href={`/blog/${post.slug}`} suppressHydrationWarning title={post.title}>
            <div className="flex flex-col md:flex-row justify-start items-start md:items-center md:gap-3 md:m-0">
                <h2 className="text-xl flex flex-row justify-start items-center">
                    <p className="header-link">
                        {post.title}
                    </p>
                </h2>
            </div>
            <p>{post.description}</p>
             <DateAndLikes article={post} className="sm:opacity-0 group-hover:opacity-100" />
        </Link>
        <TagList tags={tags} />
    </div>
);

export default BlogListItem;