import TagBadge from "@/app/blog/tag/tag-badge";
import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import { ArrowSquareOut, Dot } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import ImageList from "./image-list";
import { ProjectLink } from "../components";
import ArticleBody from "@/app/components/article-body";
import GithubStars from "./github-stars";

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

    const githubRepo = project.github ? project.github.split("/") : [];

    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="w-full flex flex-col md:flex-row justify-between">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                {project.github && (
                    <div className="flex flex-col justify-center items-end">
                        <Link href={project.github} target="_blank" className="link flex flex-row items-center justify-center">
                            Source code on GitHub
                            <ArrowSquareOut className="ml-2" weight="bold" />
                        </Link>
                        <GithubStars repository={githubRepo[githubRepo.length - 1]} author={githubRepo[githubRepo.length - 2]} />
                    </div>
                )}
            </div>
            <p>{project.description}</p>
            <div className="flex flex-row gap-2">
                {project.tags.map(tag => (
                    <TagBadge tag={tag} key={tag.id} />
                ))}
            </div>
            {project.links.length > 0 && <hr />}
            {project.links.length > 0 && <h2 className="text-xl font-bold">Links</h2>}
            <ul className="flex flex-col gap-2 justify-start items-start">
                {project.links.map(link => (
                    <li key={"li" + link}>
                        <ProjectLink link={link} key={link} />
                    </li>
                ))}
            </ul>
            <div className="flex flex-col gap-2">
                <ArticleBody text={project.body} />
            </div>
            {project.images.length > 0 && (
                <>
                    <div className="flex flex-col gap-2">
                        <ImageList images={project.images} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ProjectPage;