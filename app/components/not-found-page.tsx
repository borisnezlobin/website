"use client";
import Link from "next/link";
import { HouseSimple, TextAlignCenter } from "@phosphor-icons/react/dist/ssr";
import { SecondaryButton } from "@/components/buttons";
import SocialLinksBubble from "@/components/social-links";
import { Separator } from "@/components/separator";
import { useRouter } from "next/navigation";

const NotFoundPage = () => {
    const router = useRouter();

    return (
        <div className="h-screen w-screen flex flex-col justify-center items-center text-light-foreground dark:text-dark-foreground">
            <h1 className="text-8xl">404</h1>
            <p>Page not found</p>

            <div className="w-1/2 h-px bg-gray-500 my-4" />
            {/* <SocialLinksBubble /> */}
            <p className="text-light dark:text-dark">Do you want to go to a page that exists?</p>
            <div className="flex flex-row justify-between items-center gap-4 mt-4">
                <Link href="/" className="flex flex-row text-gray-500 justify-center items-center transition duration-100 hover:text-primary dark:hover:text-primary">
                    <HouseSimple className="w-6 h-6 " />
                    <p className="ml-2">Home</p>
                </Link>
                <Separator />
                <Link href="/blog" className="flex flex-row text-gray-500 justify-center items-center transition duration-100 hover:text-primary dark:hover:text-primary">
                    <TextAlignCenter className="w-6 h-6 " />
                    <p className="ml-2">Blog</p>
                </Link>
            </div>
            <SecondaryButton onClick={router.back} className="mt-4">Go back</SecondaryButton>
            <SocialLinksBubble />
        </div>
    );
}

export default NotFoundPage;