"use client";

import { HeartIcon } from "@phosphor-icons/react";
import { Photograph } from "@prisma/client";
import { useState } from "react";
import { likePhoto } from "./like-photo";

const PhotographItem = ({ photo }: { photo: Photograph }) => {
    const [liked, setLiked] = useState(false);

    const handleLike = () => {
        setLiked(true);
    };

    return (
        <div key={photo.id} className="rounded relative group fade-out-container">
            <div
                className="relative overflow-hidden rounded fade-out-bottom transition-all duration-300 h-[22rem]"
            >
                <div className="h-[20rem] overflow-hidden">
                    <img
                    src={photo.image}
                    alt={photo.title}
                    className="h-full object-cover"
                    />
                </div>
                <div className="h-[5rem] overflow-hidden">
                    <img
                    src={photo.image}
                    alt=""
                    aria-hidden="true"
                    className="h-[20rem] object-cover transform scale-y-[-1] relative"
                    />
                </div>
            </div>
            <div className={`pb-2 absolute bottom-0 left-0 w-full flex flex-row justify-between items-center p-2 ${liked ? "border-b border-primary dark:border-primary-dark" : ""}`}>
                <h2 className="text-dark-foreground dark:text-dark-foreground emph">
                    {photo.title}
                </h2>
                <form action={() => liked ? null : likePhoto(photo.id)}>
                    <button type="submit" onClick={handleLike} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-row text-lg cursor-pointer justify-center items-center gap-1 text-dark-foreground dark:text-dark-foreground">
                        <HeartIcon className={liked ? "text-primary dark:text-primary-dark" : ""} weight={liked ? "fill" : "light"} />
                        {photo.likes + (liked ? 1 : 0)}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default PhotographItem;