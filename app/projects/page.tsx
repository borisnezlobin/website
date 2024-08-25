import db from "../lib/db";
import { Project } from "@prisma/client";
import ProjectListItem from "./project-list-item";
import Link from "next/link";
import getMetadata from "../lib/metadata";

export const metadata = getMetadata({
  title: "My Projects",
  description: "Check out the projects I've worked on and read my writeups about each.",
})

export default async function ProjectsPage() {
  const projects = await db.project.findMany();

  return (
        <main className="min-h-[100svh] print:min-h-0 z-[1] w-full p-8 md:pt-8">
            <h1 className="text-3xl font-bold text-left dark:text-dark">Projects</h1>
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
