"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio").then((module) => module.Studio), { ssr: false });

export function StudioLoader() {
    return (
        <div className="paint-studio">
            <Studio />
        </div>
    );
}
