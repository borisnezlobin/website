import NotFoundPage from "@/app/components/not-found-page";
import db from "@/app/lib/db";
import ProjectClientComponent from "./client-component";
import getMetadata from "@/app/lib/metadata";

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
    const project = db.project.findUnique({
        where: {
            slug
        },
        include: {
            tags: true
        }
    });

    return (
        <ProjectClientComponent projectPromise={project} />
    );
}

export default ProjectPage;