import { Project} from "@prisma/client";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const ProjectListItem = ({ project }: { project: Project }) => {
    return (
        <div className="border overflow-clip border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 hover:dark:border-neutral-400 relative group cursor-pointer w-full md:h-48 p-4 rounded-lg tranition-transform duration-300 hover:shadow-lg hover:-translate-y-px">
            <h2 className="text-xl flex flex-row header-link justify-start items-center">
                {project.title}
            </h2>
            <p className="text-muted dark:text-muted-dark mb-2">
                {new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}
            </p>
            <p className="w-full overflow-hidden text-ellipsis line-clamp-4">
                {project.description}
            </p>
            {project.github && (
                <Link
                    href={project.github}
                    target="_blank"
                    aria-label="View code on Github"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-light-foreground/20 dark:hover:bg-dark-foreground/20 rounded-lg bg-transparent text-light dark:text-dark absolute top-2 right-2 hidden md:block"
                >
                    <GithubLogoIcon className="h-6 w-6 transition-colors duration-300" />
                </Link>
            )}
        </div>
    );
};

export default ProjectListItem;
