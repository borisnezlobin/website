"use client";

import { Project, Tag } from "@prisma/client";
import TagList from "../blog/tag/tag-list";
import { IconButton } from "@/components/buttons";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";

const ProjectListItem = ({ project }: { project: Project }) => {
    return (
        // a square card
        <div className="flex flex-shrink-0 relative group cursor-pointer flex-col gap-2 h-48 min-2-96 w-96 p-4 rounded-lg tranition-all hover:shadow-lg hover:-translate-y-px border-muted dark:border-muted-dark">
            <h2 className="text-xl flex flex-row header-link justify-start items-center">
                {project.title}
            </h2>
            <p>{project.description}</p>
            <TagList
                tags={project.tags || []}
                maxLength={3}
                redirectUrl={`/projects/${project.slug}`}
                className="absolute bottom-2"
            />
            {project.github && (
                <IconButton 
                    icon={<GithubLogo className="h-6 w-6" />}
                    onClick={() => { window.open(project.github || "https://github.com/borisnezlobin") }}
                    className="absolute top-2 right-2"
                />
            )}
        </div>
    );
};

export default ProjectListItem;