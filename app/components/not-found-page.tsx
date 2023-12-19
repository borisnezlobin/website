"use client";
import Link from "next/link";
import { Atom, HouseSimple, TextAlignCenter } from "@phosphor-icons/react/dist/ssr";
import { SecondaryButton } from "@/components/buttons";
import SocialLinksBubble from "@/components/social-links";
import { Separator } from "@/components/separator";
import { useRouter } from "next/navigation";

const NotFoundPage = ({ title = "Page not found" }: { title?: string }) => {
    const router = useRouter();

    const linkClass = "group-hover:text-primary transition duration-300 dark:group-hover:text-primary";

    return (
        <div className="h-screen w-screen flex flex-col justify-center items-center text-light-foreground dark:text-dark-foreground">
            <h1 className="text-8xl">404</h1>
            <p>{title}</p>

            <div className="w-1/2 h-px bg-muted dark:bg-muted-dark my-4" />
            {/* <SocialLinksBubble /> */}
            <p className="text-light dark:text-dark">Do you want to go to a page that exists?</p>
            <div className="flex flex-row justify-between items-center gap-4 mt-4">
                <Link href="/" className="flex flex-row group text-gray-500 justify-center items-center">
                    <HouseSimple className={"w-6 h-6 " + linkClass} />
                    <p className={"ml-2 " + linkClass}>Home</p>
                </Link>
                <Separator />
                <Link href="/blog" className="flex flex-row group text-gray-500 justify-center items-center">
                    <TextAlignCenter className={"w-6 h-6 " + linkClass} />
                    <p className={"ml-2 " + linkClass}>Blog</p>
                </Link>
                <Separator />
                <Link href="/projects" className="flex flex-row group text-gray-500 justify-center items-center">
                    <Atom className={"w-6 h-6 " + linkClass} />
                    <p className={"ml-2 " + linkClass}>Projects</p>
                </Link>
            </div>
            <SecondaryButton onClick={router.back} className="mt-4">Go back</SecondaryButton>
            <SocialLinksBubble />
        </div>
    );
}

export default NotFoundPage;