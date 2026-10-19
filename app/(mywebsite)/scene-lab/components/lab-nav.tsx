import Link from "next/link";
import { FOCUS_RING } from "@/app/components/action";
import { directionHref, SCENES, type Scene } from "../directions";

const LINK = `rounded-md px-2 py-1 text-sm text-muted hover:text-light-foreground data-[current=true]:text-light-foreground data-[current=true]:underline data-[current=true]:decoration-primary data-[current=true]:underline-offset-4 dark:text-muted-dark dark:hover:text-dark-foreground dark:data-[current=true]:text-dark-foreground ${FOCUS_RING}`;

/** Switches between the directions of one scene, so they can be compared back to back. */
export function LabNav({ scene, direction }: { scene: Scene["slug"]; direction: string }) {
    const current = SCENES.find((candidate) => candidate.slug === scene);
    if (!current) return null;
    return (
        <nav aria-label={`${current.name} directions`} className="fixed bottom-4 left-4 z-30 flex flex-wrap items-center gap-1 rounded-lg bg-light-background/85 p-1 shadow-md backdrop-blur dark:bg-dark-background/85">
            <Link href="/scene-lab" className={LINK}>
                {current.name}
            </Link>
            {current.directions.map((option) => (
                <Link key={option.slug} href={directionHref(scene, option.slug)} data-current={option.slug === direction} aria-current={option.slug === direction ? "page" : undefined} className={LINK}>
                    {option.name}
                </Link>
            ))}
        </nav>
    );
}
