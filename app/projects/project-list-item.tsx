"use client";

import { Project, Tag } from "@prisma/client";
import TagList from "../blog/tag/tag-list";
import { IconButton } from "@/components/buttons";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";

const ProjectListItem = ({ project }: { project: Project }) => {
  return (
    <div className="flex border border-neutral-300 dark:border-neutral-600 relative group cursor-pointer flex-col h-48 w-full p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px">
      <h2 className="text-xl flex flex-row header-link justify-start items-center">
        {project.title}
      </h2>
      <p className="text-muted dark:text-muted-dark mb-2">
        {project.createdAt.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="text-ellipsis h-full w-full">{project.description}</p>
      <TagList
        // @ts-ignore
        tags={project.tags || []}
        maxLength={3}
        redirectUrl={`/projects/${project.slug}`}
        className="absolute bottom-2"
      />
      {project.github && (
        <IconButton
          icon={<GithubLogo className="h-6 w-6" />}
          onClick={() => {
            window.open(project.github || "https://github.com/borisnezlobin");
          }}
          className="absolute top-2 right-2"
        />
      )}
    </div>
  );
};

export default ProjectListItem;
