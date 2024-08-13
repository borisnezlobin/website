import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import getMetadata from "@/app/lib/metadata";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import GithubStars from "./github-stars";
import { ProjectLink } from "../components";
import ArticleBody from "@/app/components/article-body";
import TagList from "@/app/blog/tag/tag-list";

export async function generateStaticParams() {
    const projects = await db.project.findMany({
        select: { slug: true }
    });

    return projects.map((project) => ({ params: { slug: project.slug } }));
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}) {
    const proj = await db.project.findUnique({
        where: { slug: params.slug },
    });

    if (!proj) {
        return getMetadata({
            title: "Project not found",
            info: "404",
            description:
                "This project couldn't be found.\nVisit my website to contact me, see what I'm up to, and learn more about me!",
        });
    }

    return getMetadata({
        title: `${proj.title}`,
        info: proj.likes > 0 ? `${proj.likes} Like${proj.likes == 1 ? "" : "s"}` : "",
        description: `${proj.description}`,
    });
}

async function ProjectPage({ params: { slug } }: { params: { slug: string } }) {
    console.log("Rendering project page for slug: " + slug);
    const project = await db.project.findUnique({
        where: {
            slug
        },
        include: {
            tags: true
        }
    });

    if (!project) {
        return <NotFoundPage title="Project not found" />;
    }

    const githubRepo = project ? (project.github ? project.github.split("/") : []) : [];

    return (
        <div className="flex flex-col gap-4 print:gap-0 p-8 md:p-16">
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between ">
                <h1 className="text-3xl font-bold">
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
            <TagList tags={project.tags} />
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
            {/* this part is so bad, and I really can't be bothered to figure out how to fix it atm... I swear I will make it look good someday */}
            {/* {(project && project.images.length > 0) && (
                <>
                    <div className="flex flex-col gap-2">
                        <ImageList images={project.images} />
                    </div>
                </>
            )} */}
        </div>
    );
}

export default ProjectPage;