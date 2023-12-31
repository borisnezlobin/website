"use client";

import { Star } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const GithubStars = ({ repository, author }: { repository: string, author: string }) => {
    const [stars, setStars] = useState(0);
    
    useEffect(() => {
        fetch(`https://api.github.com/repos/${author}/${repository}`)
        .then((response) => response.json())
        .then((data) => {
            setStars(data.stargazers_count);
        });
    }, []);
    
    return (
        <div className="flex items-center gap-1 text-sm">
            <Star className="w-3 h-3" weight="fill" />
            <span>{stars}</span>
            <span>Star{stars === 1 ? "" : "s"}</span>
        </div>
    );
};

export default GithubStars;