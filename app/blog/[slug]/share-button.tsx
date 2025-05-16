"use client"

import { IconButton } from "@/components/buttons";
import { Share } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

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

export default ShareButton;