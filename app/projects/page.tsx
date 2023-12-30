import { faker } from "@faker-js/faker";
import db from "../lib/db"
import { revalidatePath } from "next/cache";
import { Project } from "@prisma/client";
import ProjectListItem from "./project-list-item";
import Link from "next/link";
import { seedTags } from "../blog/components/idontlikevercelbuilds";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    include: {
      tags: true
    }
  });

  async function seedProjects() {
    const tags = await db.tag.findMany();
    if(!tags) {
      await seedTags();
    }

    console.log("Deleting all projects...");
    await db.project.deleteMany();
    console.log("Seeding database with projects...");
    await db.project.create({
      data: {
        title: "Portfolio",
        slug: "portfolio",
        description: "The website you're on right now",
        body: faker.lorem.paragraphs(5),
        github: "https://github.com/borisnezlobin/website",
        links: [
          "https://github.com/borisnezlobin/website"
        ],
        tags: {
          connect: [
            { slug: "nextjs" },
            { slug: "js" },
            { slug: "ts" },
            { slug: "sql" }
          ]
        }
      }
    });

    await db.project.create({
      data: {
        title: "Markdown Editor",
        slug: "editor",
        description: "An Electron app for editing markdown files in different modes (with good UI!)",
        body: faker.lorem.paragraphs(5),
        github: "https://github.com/borisnezlobin/editor",
        images: [
          "https://private-user-images.githubusercontent.com/146669165/280578991-fbd8557a-15df-4451-ab78-9fa8d9740e00.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTEiLCJleHAiOjE3MDMxMDcyNTksIm5iZiI6MTcwMzEwNjk1OSwicGF0aCI6Ii8xNDY2NjkxNjUvMjgwNTc4OTkxLWZiZDg1NTdhLTE1ZGYtNDQ1MS1hYjc4LTlmYThkOTc0MGUwMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMxMjIwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMTIyMFQyMTE1NTlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03ZDc4MGI5MGNkZGY2ODg0YjBkMzExZGY0NzkxNjc0MmU5ZDIzYjgxYjRiYjJjOTZmYmFjNTY1YzczZDk5NzllJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.Y3LVcn5r1BIcLK-qkJa6e8BgYZrmB6hq0a9gB0clcYw",
          "https://private-user-images.githubusercontent.com/146669165/280578926-bfd786be-dae9-4757-841a-bbf35d75b009.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTEiLCJleHAiOjE3MDMxMDcyNTksIm5iZiI6MTcwMzEwNjk1OSwicGF0aCI6Ii8xNDY2NjkxNjUvMjgwNTc4OTI2LWJmZDc4NmJlLWRhZTktNDc1Ny04NDFhLWJiZjM1ZDc1YjAwOS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMxMjIwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMTIyMFQyMTE1NTlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MzMyN2NiZDZlMDAyNGZmMGY0NTk5MTYyM2Y4N2MxMTFjYzY0MmRlZDZkNGRmZmFiMzE0NWIwZTQ0NTc4M2ExJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.iD6P7pOuCz_EQjjTEKojn65ZOIODp26gd6DpxoMk0zQ"
        ],
        tags: {
          connect: [
            { slug: "electron" },
            { slug: "js" },
            { slug: "react" },
            { slug: "ts" },
            { slug: "in-progress" }
          ]
        }
      }
    });

    await db.project.create({
      data: {
        title: "OneShip",
        slug: "oneship",
        description: "Used by Palo Alto High School to provide data to students automatically -- straight from the calendar, publications, and athletics websites.",
        body: faker.lorem.paragraphs(5),
        github: "https://github.com/borisnezlobin/oneship",
        links: [
          "https://paly.app",
        ],
        tags: {
          connect: [
            { slug: "react" },
            { slug: "js" },
          ]
        }
      }
    });

    console.log("Done seeding database with projects.");
  }

  if (!projects || projects.length === 0) {
    seedProjects();
    revalidatePath("/projects");
  }

  return (
    <main className="p-4">
      <h1 className="text-6xl font-bold text-left dark:text-dark edo">
        Projects
      </h1>
      <p className="dark:text-dark text-left mt-2">
        Check out all of the things I&apos;ve worked on!<br />
        I&apos;ve made a lot of cool stuff, and helped out with some open-source projects that I&apos;m interested in. For every project, I tend to do a writeup on it, so you can learn more about it and how it works. They also serve as a way for me to document what I&apos;ve learned and practice my writing skills.
      </p>

      <div className="flex flex-wrap gap-4 mt-4">
        {projects.map((project: Project) => (
        <Link key={project.slug} href={"/projects/" + project.slug}>
          <ProjectListItem project={project} />
        </Link>
        ))}
      </div>
    </main>
  )
}