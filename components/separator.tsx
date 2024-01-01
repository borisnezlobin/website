import React from "react";

interface SeparatorProps {
    vertical?: boolean;
    children?: React.ReactNode,
    size?: "small" | "medium" | "large" | "xlarge",
    className?: string
}

const sizes = {
    "small": {
        "vertical": "h-5 w-px",
        "horizontal": "w-5 h-px"
    },
    "medium": {
        "vertical": "h-7 w-px",
        "horizontal": "w-7 h-px"
    },
    "large": {
        "vertical": "h-12 w-px",
        "horizontal": "w-12 h-px"
    },
    "xlarge": {
        "vertical": "h-16 w-px",
        "horizontal": "w-16 h-px"
    }
}

export const Separator: React.FC<SeparatorProps> = ({ vertical = false, children, size = "medium", className = "" }) => {
    return (
        <div className={`flex ${vertical ? "flex-row" : "flex-col"} justify-start gap-2 items-center ${className}`}>
            <div className={`bg-muted dark:bg-muted-dark ${sizes[size][!vertical ? "vertical" : "horizontal"]} ${!vertical ? " mx-2" : "my-2"}`} />
            {children ?
            <>
                {children}
                <div className={`bg-muted dark:bg-muted-dark ${!vertical ? "mx-2" : "my-2"}`} />
            </>
            : <></>
            }
        </div>
    );
}