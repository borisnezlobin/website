"use client"

import { IconButton } from "@/components/buttons";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ReactNode, useState } from "react";

const SearchBar = ({
    query,
    children,
}: {
    query?: string;
    children?: ReactNode;
}) => {
    const [search, setSearch] = useState(query || "");

    return (
        <form
            action={() => {
                window.location.href = "/blog/search/" + search;
            }}
            className="mt-4 flex w-full flex-row items-center justify-center gap-2 flex-wrap print:hidden"
        >
            <input
                type="text"
                placeholder="Search"
                defaultValue={query}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 max-w-2xl w-full bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground border border-light-foreground dark:border-dark-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-light-foreground dark:focus:ring-dark-foreground"
            />
            <IconButton
                className="flex flex-row justify-center items-center gap-2 transition-all duration-300"
                icon={
                <>
                    <MagnifyingGlass className="h-6 w-6" />
                    <p className="!bg-transparent text-light dark:text-dark">Search</p>
                </>
                }
            />
            {children}
        </form>
    );
};

export { SearchBar };