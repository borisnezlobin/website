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

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
        <main className="pagepad mt-4">
            <h1 className="text-3xl font-bold text-left dark:text-dark emph">Projects</h1>
            <p className="dark:text-dark text-left mt-2">
                Check out all of the things I&apos;ve worked on!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 mt-8 md:mt-4">
                {projects.map((project: Project) => (
                    <Link
                        key={project.slug}
                        href={"/projects/" + project.slug}
                        aria-label={project.title}
                    >
                        <ProjectListItem project={project} />
                    </Link>
                ))}
            </div>
        </main>
    );
}
