import { ArrowRightIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const ProjectLink = ({ link }: { link: string }) => {
    const host = link.split("/")[2].split(".")[0];

    if(link.includes("borisnezlobin.com") || link.includes("bnezlobin")) {
        return (
            <div className="print:flex flex-row items-center justify-between gap-4">
                <p className="text-base font-bold">
                    Related Article
                </p>
                <Link aria-label="Related Article" href={link} className="link md:ml-4 text-sm emph flex flex-row gap-2 justify-center items-center text-muted dark:text-muted-dark print:text-muted">
                    {link}
                    <ArrowRightIcon weight="bold" className="print:hidden" />
                </Link>
            </div>
        );
    }

    return (
        <div className="print:flex flex-row items-center justify-between gap-4">
            <p className="text-base font-bold">
                {host == "github" ? "GitHub" : host.slice(0, 1).toUpperCase() + host.slice(1)}
            </p>
            <Link aria-label={host} href={link} target="_blank" className="link md:ml-4 gap-2 text-muted text-sm dark:text-muted-dark print:text-muted emph">
                {link}
                <ArrowSquareOutIcon weight="bold" className="inline print:hidden" />
            </Link>
        </div>
    );
}

export { ProjectLink };