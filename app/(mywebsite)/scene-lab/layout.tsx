import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/** Direction previews for the projects page. They exist only in development. */
export default function SceneLabLayout({ children }: { children: ReactNode }) {
    if (process.env.NODE_ENV === "production") notFound();
    return children;
}
