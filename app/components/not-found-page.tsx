"use client";
import Link from "next/link";
import { Atom, HouseSimple } from "@phosphor-icons/react/dist/ssr";
import { SecondaryButton } from "@/app/components/buttons";
import SocialLinksBubble from "@/app/components/social-links-bubble";
import { Separator } from "@/app/components/separator";
import { useRouter } from "next/navigation";
import { Newspaper } from "@phosphor-icons/react";

const NotFoundPage = ({ title = "Page not found" }: { title?: string }) => {
    const router = useRouter();

    const linkClass =
        "group-hover:text-primary transition duration-300 dark:group-hover:text-primary";

    return (
        <div className="h-[100svh] relative top-[-3rem] flex flex-col justify-center items-center text-light-foreground dark:text-dark-foreground">
            <h1 className="text-8xl emph text-primary dark:text-primary-dark">404</h1>
                <p>{title} :P</p>

                <div className="w-full md:w-1/2 h-px !bg-muted dark:!bg-muted-dark my-4" />

                <div className="flex flex-row justify-between items-center gap-4 mt-4">
                    <Link
                        href="/"
                        aria-label="Home"
                        className="flex flex-row group text-light-foreground dark:text-dark-foreground justify-center items-center"
                    >
                        <HouseSimple className={"w-6 h-6 " + linkClass} />
                        <p className={"ml-2 " + linkClass}>Home</p>
                    </Link>
                    <Separator />
                    <Link
                        href="/blog"
                        aria-label="Blog"
                        className="flex flex-row group text-light-foreground dark:text-dark-foreground justify-center items-center"
                    >
                        <Newspaper className={"w-6 h-6 " + linkClass} />
                        <p className={"ml-2 " + linkClass}>Blog</p>
                    </Link>
                    <Separator />
                    <Link
                        href="/projects"
                        aria-label="Projects"
                        className="flex flex-row group text-light-foreground dark:text-dark-foreground justify-center items-center"
                    >
                        <Atom className={"w-6 h-6 " + linkClass} />
                        <p className={"ml-2 " + linkClass}>Projects</p>
                    </Link>
                </div>
                <SecondaryButton aria-label="Back" onClick={router.back} className="mt-8">
                    Go back
                </SecondaryButton>
            <SocialLinksBubble />
        </div>
    );
};

export default NotFoundPage;
