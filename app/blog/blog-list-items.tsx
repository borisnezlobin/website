"use client"

import { Article, Tag } from "@prisma/client";
import Link from "next/link";
import Badge from "../components/badge";
import { DateAndLikes } from "./date-and-likes";

const BlogListItem = ({ post, tags = [] } : { post: Article, tags?: Tag[] }) => (
    <div key={post.id} className="mt-8 cursor-pointer group">
        <Link href={`/blog/${post.slug}`} suppressHydrationWarning>
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
        {tags && tags.map((tag) => (
            <Link href={"/blog/tag/" + tag.slug} onClick={(e) => e.stopPropagation()} key={tag.id} title={"Find more " + tag.name + " articles"}>
                <Badge className="ml-2 hover:-translate-y-px transition duration-300 active:translate-y-px">
                    {tag.name}
                </Badge>
            </Link>
        ))}
    </div>
);

export default BlogListItem;