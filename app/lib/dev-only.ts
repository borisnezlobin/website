import { notFound } from "next/navigation";

// Guard for playground / utility routes that should only exist on the dev server.
// Call at the top of a page's server component; it 404s on any production build.
export function devOnly() {
    if (process.env.NODE_ENV === "production") notFound();
}
