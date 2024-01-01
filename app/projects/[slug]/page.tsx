import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import ProjectClientComponent from "./client-component";

async function ProjectPage({ params: { slug } }: { params: { slug: string } }) {
    console.log("Rendering project page for slug: " + slug);
    const project = db.project.findUnique({
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


    return (
        <ProjectClientComponent projectPromise={project} />
    );
}

export default ProjectPage;