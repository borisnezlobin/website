"use client";

import { useEffect, useState } from "react";

export type RailItem = { id: string; title: string };

const READING_BAND = "-40% 0px -55% 0px";

function useSectionInView(items: RailItem[]) {
    const [activeId, setActiveId] = useState(items[0]?.id);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entering = entries.find((entry) => entry.isIntersecting);
                if (entering) setActiveId(entering.target.id);
            },
            { rootMargin: READING_BAND },
        );
        items.forEach(({ id }) => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
        return () => observer.disconnect();
    }, [items]);

    return activeId;
}

const LINK_BASE = "relative flex min-h-9 items-center rounded-sm py-1 text-sm leading-snug outline-none transition-colors duration-200 hover:text-light-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-light-background dark:hover:text-dark-foreground dark:focus-visible:ring-offset-dark-background";
const LINK_STATE = {
    current: "text-light-foreground dark:text-dark-foreground",
    idle: "text-muted dark:text-muted-dark",
};
const TICK_STATE = { current: "scale-x-100", idle: "scale-x-0" };

export function PlateRail({ items }: { items: RailItem[] }) {
    const activeId = useSectionInView(items);

    return (
        <nav aria-label="Projects on this page" className="hidden lg:block print:hidden">
            <ul className="sticky top-24 mt-24 flex flex-col">
                {items.map(({ id, title }) => {
                    const state = id === activeId ? "current" : "idle";
                    return (
                        <li key={id}>
                            <a href={`#${id}`} aria-current={state === "current" ? "true" : undefined} className={`${LINK_BASE} ${LINK_STATE[state]}`}>
                                <span
                                    aria-hidden="true"
                                    className={`absolute -left-5 top-1/2 h-0.5 -translate-y-1/2 w-3 origin-left bg-primary transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${TICK_STATE[state]}`}
                                />
                                {title}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
