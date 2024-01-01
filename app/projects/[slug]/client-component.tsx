"use client";

import LoadingEffect from "@/app/components/loading-or-content";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Project } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import GithubStars from "./github-stars";
import TagList from "@/app/blog/tag/tag-list";
import { ProjectLink } from "../components";
import ArticleBody from "@/app/components/article-body";
import ImageList from "./image-list";

const ProjectClientComponent = ({ projectPromise }: { projectPromise: any }) => {
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        projectPromise.then(setProject);
    }, []);

    const loading = !project;
    const githubRepo = project ? (project.github ? project.github.split("/") : []) : [];


    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="w-full flex flex-col md:flex-row justify-between">
                <h1 className="text-3xl font-bold">
                    <LoadingEffect
                        text={project ? project.title : ""}
                        loading={loading}
                        expectedLength="medium"
                    />
                </h1>
                {(project && project.github) && (
                    <div className="flex flex-col justify-center items-end">
                        <Link href={project.github} aria-label="View code on Github" target="_blank" className="link flex flex-row items-center justify-center">
                            Source code on GitHub
                            <ArrowSquareOut className="ml-2" weight="bold" />
                        </Link>
                        {loading ? null : <GithubStars repository={githubRepo[githubRepo.length - 1]} author={githubRepo[githubRepo.length - 2]} />}
                    </div>
                )}
            </div>
            <p>
                <LoadingEffect
                    text={project ? project.description : ""}
                    loading={loading}
                    expectedLength="long"
                />
            </p>
            {/* @ts-ignore */}
            {project && <TagList tags={project.tags} />}
            {(project && project.links.length > 0) && <hr />}
            {(project && project.links.length > 0) && <h2 className="text-xl font-bold">Links</h2>}
            {project &&
                <ul className="flex flex-col gap-2 justify-start items-start">
                    {project.links.map(link => (
                        <li key={"li" + link}>
                            <ProjectLink link={link} key={link} />
                        </li>
                    ))}
                </ul>
            }
            <div className="flex flex-col gap-2">
                <ArticleBody text={project ? project.body : undefined} />
            </div>
            {(project && project.images.length > 0) && (
                <>
                    <div className="flex flex-col gap-2">
                        <ImageList images={project.images} />
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectClientComponent;