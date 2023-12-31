import { Tag } from "@prisma/client";
import TagBadge from "./tag-badge";

interface TagListProps {
    tags: Tag[],
    maxLength?: number,
    redirectUrl?: string
    className?: string
}

const TagList = ({ tags, maxLength = 5, redirectUrl, className }: TagListProps) => {
    return (
        <div className={`flex flex-row justify-start items-center gap-2 ${className}`}>
            {tags.slice(0, maxLength).map((tag) => <TagBadge tag={tag} key={tag.id} />)}
            {tags.length > maxLength && (
                <p className="text-sm">
                    +{tags.length - maxLength} more
                </p>
            )}
        </div>
    );
}

export default TagList;