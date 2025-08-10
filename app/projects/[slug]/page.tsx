import NotFoundPage from "@/app/components/not-found-page";
import getMetadata from "@/app/lib/metadata";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import GithubStars from "./github-stars";
import { ProjectLink } from "../project-link";
import ArticleBody from "@/app/components/article-body";
import { getProject, getProjects } from "@/app/lib/db-caches";
import BackToRouteLink from "@/app/components/back-to-route";
import { Wrapper } from "@/app/notes/[slug]/[section]/skibidiwrapper";
import { readFileSync } from "fs";
import { getProjectHTMLPath } from "@/app/utils/get-note-mdx-path";

export async function generateStaticParams() {
    const projects = await getProjects();

    console.log("Generating paths for projects:", projects.map((project) => project.slug));
    return projects.map((project) => ({ params: { slug: project.slug } }));
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}) {
    const proj = await getProject(params.slug);

    if (!proj) {
        return getMetadata({
            title: "Project not found.",
            info: "404",
            subtitle: "Boris Nezlobin.",
            description:
                "This project couldn't be found. Visit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: proj.title,
        info: new Date(proj.createdAt).toLocaleDateString(),
        subtitle: "A project by Boris Nezlobin.",
        description: proj.description,
    });
}

export default async function ProjectPage({ params: { slug } }: { params: { slug: string } }) {
    console.log("Rendering project page for slug: " + slug);
    const project = await getProject(slug);
    const projectBody = readFileSync(getProjectHTMLPath(slug), "utf-8");

    if (!project) {
        return <NotFoundPage title="Project not found" />;
    }

    const githubRepo = project ? (project.github ? project.github.split("/") : []) : [];

    return (
        <div className="flex flex-col items-start gap-4 print:gap-0 p-8 md:p-16 print:p-0">
            <BackToRouteLink href="/projects" text="Back to Projects" />
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between ">
                <h1 className="text-3xl font-bold mb-3 md:mb-0 emph">
                    {project.title}
                </h1>
                {project.github && (
                    <div className="flex flex-col justify-center items-start md:items-end print:hidden">
                        <Link href={project.github} aria-label="View code on Github" target="_blank" className="link emph flex flex-row items-center justify-center print:text-muted print:dark:text-muted">
                            Source code on GitHub
                            <ArrowSquareOutIcon className="ml-2" weight="bold" />
                        </Link>
                        <GithubStars repository={githubRepo[githubRepo.length - 1]} author={githubRepo[githubRepo.length - 2]} />
                    </div>
                )}
            </div>
            <p className="print:my-2">
                {project.description}
            </p>
            {project.links.length > 0 && <h2 className="text-xl font-bold mt-3">Links</h2>}
            <ul className="flex flex-col gap-2 print:pt-2 justify-start items-start">
                {project.links.map(link => (
                    <li key={"li" + link} className="md:ml-4">
                        <ProjectLink link={link} />
                    </li>
                ))}
            </ul>
            <hr className="my-2 w-full print:my-4" />
            <div className="flex flex-col gap-2 mt-4 print:m-0 self-center relative w-full max-w-2xl">
                <Wrapper content={projectBody} />
            </div>
        </div>
    );
};