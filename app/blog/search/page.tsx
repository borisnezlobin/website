import { LinkButton, PrimaryButton } from "@/components/buttons";
import { SearchBar } from "../[slug]/components"
import Link from "next/link";

const SearchPage = () => {
    return (
        <div className="min-h-screen dark:bg-dark-background w-screen p-8 text-light-foreground dark:text-dark-foreground flex flex-col justify-center items-center">
            <h1 className="text-5xl">Blog / Search</h1>
            <SearchBar />
            <div className="mt-4 flex flex-row justify-center items-center gap-2">
                <Link href="/blog" className="link">
                    Go to blog
                </Link>
                <p className="text-muted dark:text-muted-dark">
                    or
                </p>
                <Link href="/blog/tags" className="link">
                    Explore articles
                </Link>
            </div>
            <PrimaryButton className="mt-4">
                Feelin' lucky?
            </PrimaryButton>
        </div>
    )
};

export default SearchPage;