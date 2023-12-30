import TagBadge from "@/app/blog/tag/tag-badge";
import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import ClickableImage from "./image-list";
import ImageList from "./image-list";

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

    if(!project){
        return <NotFoundPage title="Project not found" />;
    }

    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="w-full flex flex-col md:flex-row justify-between">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                {project.github && (
                    <Link href={project.github} target="_blank" className="link flex flex-row items-center justify-center">
                        Source code on GitHub
                        <ArrowSquareOut className="ml-2" weight="bold" />
                    </Link>
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
            <div className="flex flex-col gap-2 justify-start items-start">
                {project.links.map(link => (
                    <Link href={link} key={link} target="blank" className="link flex flex-row gap-2 justify-center items-center">
                        {link}
                        <ArrowSquareOut className="ml-2" weight="bold" />
                    </Link>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <p>{project.body}</p>
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