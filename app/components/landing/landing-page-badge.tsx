import { Separator } from "@/components/separator";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const LandingPageBadge = ({
    title, description, url, className
}: { title: string, description: string, url?: string, className?: string }) => {
    const component = (
        <div className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-start gap-2 rounded-lg border dark:border-neutral-800 ${url ? "cursor-pointer hover:scale-105" : ""}`}>
            <b className="text-xl">
                {title}
            </b>
            <Separator size="medium" className="hidden md:block" />
            <p className="">
                {description}
            </p>
            {url && <ArrowSquareOut />}
        </div>
    );

    if(url){
        return (
            <Link href={url} rel="noopener noreferrer" target="_blank">
                {component}
            </Link>
        )
    }

    return component;
}

export { LandingPageBadge };