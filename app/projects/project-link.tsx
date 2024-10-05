import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const ProjectLink = ({ link }: { link: string }) => {
    const host = link.split("/")[2].split(".")[0];

    if(link.includes("borisn.dev") || link.includes("bnezlobin")) {
        return (
            <div>
                <p className="text-base font-bold">
                    Related Article
                </p>
                <Link aria-label="Related Article" href={link} className="link md:ml-4 text-sm emph flex flex-row gap-2 justify-center items-center text-muted dark:text-muted-dark print:text-muted">
                    {link}
                    <ArrowRight weight="bold" />
                </Link>
            </div>
        );
    }

    return (
        <div >
            <p className="text-base font-bold">
                {host == "github" ? "GitHub" : host.slice(0, 1).toUpperCase() + host.slice(1)}
            </p>
            <Link aria-label={host} href={link} target="_blank" className="link md:ml-4 gap-2 text-muted text-sm dark:text-muted-dark print:text-muted emph">
                {link}
                <ArrowSquareOut weight="bold" className="inline" />
            </Link>
        </div>
    );
}

export { ProjectLink };