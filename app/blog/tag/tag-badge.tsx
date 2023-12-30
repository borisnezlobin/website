"use client";

import Badge from "@/app/components/badge";
import { Tag } from "@prisma/client";
import Link from "next/link";

const TagBadge = ({ tag }: { tag: Tag }) => {
    return (
        <Link href={"/blog/tag/" + tag.slug} onClick={(e) => e.stopPropagation()} key={tag.id} title={"Find more " + tag.name + " articles"}>
            <Badge className="badge hover:-translate-y-px transition duration-300 active:translate-y-px">
                {tag.name}
            </Badge>
        </Link>
    );
}

export default TagBadge;