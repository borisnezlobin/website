import { SearchBar } from "../[slug]/search-bar";
import Link from "next/link";
import { Metadata } from "next";
import getMetadata from "@/app/lib/metadata";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = getMetadata({
    title: "Search My Blog",
    description: "Search for articles on my blog",
});

const SearchPage = () => {
    return (
        <div className="flex flex-col justify-center items-start mb-[30vh] p-4 lg:p-0">
            <div className="h-[100svh] relative top-[-3rem] items-center w-full flex flex-col justify-center p-4">
                <h1 className="text-3xl">Search Blog</h1>
                <SearchBar />
                <div className="mt-4 flex flex-row justify-center items-center gap-2">
                    <Link
                        href="/blog"
                        className="link font-semibold"
                        aria-label="Go to blog"
                    >
                        Go to blog
                        <ArrowRight weight="bold" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
