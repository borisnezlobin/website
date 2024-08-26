import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import getMetadata from "@/app/lib/metadata";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import GithubStars from "./github-stars";
import { ProjectLink } from "../components";
import ArticleBody from "@/app/components/article-body";
import { getProject, getProjects } from "@/app/lib/db-caches";

export async function generateStaticParams() {
    const projects = await getProjects();

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
            title: "Project not found",
            info: "404",
            description:
                "This project couldn't be found. Visit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${proj.title}`,
        description: `${proj.description}`,
    });
}

async function ProjectPage({ params: { slug } }: { params: { slug: string } }) {
    console.log("Rendering project page for slug: " + slug);
    const project = await getProject(slug);

    if (!project) {
        return <NotFoundPage title="Project not found" />;
    }

    const githubRepo = project ? (project.github ? project.github.split("/") : []) : [];

    return (
        <div className="flex flex-col gap-4 print:gap-0 p-8 md:p-16">
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between ">
                <h1 className="text-3xl font-bold mb-3 md:mb-0">
                    {project.title}
                </h1>
                {project.github && (
                    <div className="flex flex-col justify-center items-start md:items-end">
                        <Link href={project.github} aria-label="View code on Github" target="_blank" className="link flex flex-row items-center justify-center print:text-muted print:dark:text-muted">
                            Source code on GitHub
                            <ArrowSquareOut className="ml-2" weight="bold" />
                        </Link>
                        <GithubStars repository={githubRepo[githubRepo.length - 1]} author={githubRepo[githubRepo.length - 2]} />
                    </div>
                )}
            </div>
            <p className="print:my-2">
                {project.description}
            </p>
            {project.links.length > 0 && <hr className="print:my-4" />}
            {project.links.length > 0 && <h2 className="text-xl font-bold">Links</h2>}
            <ul className="flex flex-col gap-2 justify-start items-start">
                {project.links.map(link => (
                    <li key={"li" + link} className="md:ml-4">
                        <ProjectLink link={link} key={link} />
                    </li>
                ))}
            </ul>
            <hr className="mt-2 print:my-4 w-full" />
            <div className="flex flex-col gap-2 mt-4 self-center relative w-full max-w-2xl">
                <ArticleBody body={project.body} />
            </div>
        </div>
    );
}

export default ProjectPage;