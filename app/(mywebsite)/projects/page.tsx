import db from "../../lib/db";
import { Project } from "@prisma/client";
import ProjectListItem from "./project-list-item";
import Link from "next/link";
import getMetadata from "../../lib/metadata";
import { getProjects } from "../../lib/db-caches";

export const metadata = getMetadata({
    title: "Projects.",
    info: "Boris Nezlobin.",
    description: "Check out the projects I've worked on and read my writeups about each.",
})

const SmallProjectListItem = ({ link, linkText, description }: { link: string, linkText: string, description: string }) => {
    return (
        <Link href={link} target="_blank" rel="noopener noreferrer" className="">
            <b className="text-lg font-semibold text-left dark:text-dark hover:underline">{linkText}</b>
            <p className="text-left mt-2 dark:text-dark">
                {description}
            </p>
        </Link>
    );
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
        <main className="pagepad mt-4">
            <h1 className="text-3xl font-bold text-left dark:text-dark emph">Projects</h1>
            <p className="dark:text-dark text-left mt-2">
                What does a redhead with free time and a computer do?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 mt-8 md:mt-4">
                {projects.map((project: Project) => project.slug.indexOf("draft") === -1 ? (
                    <Link
                        key={project.slug}
                        href={"/projects/" + project.slug}
                        aria-label={project.title}
                    >
                        <ProjectListItem project={project} />
                    </Link>
                ) : null)}
            </div>
            <div className="w-full flex justify-start flex-col items-start mt-8">
                <b className="w-full text-left mb-4">
                    and other cool stuff:
                </b>
                <SmallProjectListItem
                    link="https://x.com/b_nezlobin/status/1973213855754092749"
                    linkText="modelling differential rotation in solar active regions 600x faster than SunPy"
                    description="polynomial approximation from historical data of solar active regions that's more accurate and a lot faster than SunPy!"
                />
            </div>
        </main>
    );
}
