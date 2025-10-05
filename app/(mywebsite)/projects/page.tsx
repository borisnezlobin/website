import { Project } from "@prisma/client";
import ProjectListItem from "./project-list-item";
import Link from "next/link";
import getMetadata from "../../lib/metadata";
import { getProjects } from "../../lib/db-caches";
import Background from "@/app/components/landing/background";
import { ScrollForMore } from "@/app/components/landing/scroll-for-more";
import { ReactNode } from "react";
import { AlarmIcon, ClockCounterClockwiseIcon, GithubLogoIcon, SunIcon, XIcon, XLogoIcon } from "@phosphor-icons/react/dist/ssr";

export const metadata = getMetadata({
    title: "Projects.",
    info: "Boris Nezlobin.",
    description: "Check out the projects I've worked on and read my writeups about each.",
})

const SmallProjectListItem = ({ link, linkText, description, icon }: { link: string, linkText: string, description: string, icon: ReactNode }) => {
    return (
        <Link href={link} target="_blank" rel="noopener noreferrer" className="group">
            <div className="flex items-center space-x-4 max-w-4xl">
                <div className="text-3xl text-muted dark:text-muted-dark group-hover:text-light-foreground group-hover:dark:text-dark-foreground transition-colors duration-300">
                    {icon}
                </div>
                <div className="w-full flex flex-col justify-center items-start">
                    <b className="text-lg transition-colors duration-300 font-semibold text-left text-muted dark:text-muted-dark group-hover:text-light-foreground group-hover:dark:text-dark-foreground hover:underline">
                        {linkText}
                    </b>
                    <p className="text-left mt-1 dark:text-dark-foreground">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
        <div>
            <div className="hidden md:block">
                <Background
                    words={['Featured by Hack Club', '5k downloads', 'open source', 'free to use']}
                    charsBetweenWords={6}
                />
            </div>
            <main className="pagepad">
                <div className="h-[100svh] relative top-[-6rem] items-center w-full flex flex-col justify-center p-4 print:h-auto print:relative print:top-0 print:p-0 print:mb-2">
                    <h1 className="text-3xl font-bold text-left dark:text-dark emph">Projects</h1>
                    <p className="dark:text-dark text-left mt-2">
                        What happens when you give me a computer and Wi-Fi?
                    </p>
                </div>

                <ScrollForMore text="Scroll to find out" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 mt-8 md:mt-4">
                    {projects.map((project: Project) => project.slug.indexOf("draft") === -1 ? (
                        <Link
                            key={project.slug}
                            href={"/projects/" + project.slug}
                            aria-label={project.title}
                        >
                            <ProjectListItem project={project} />
                        </Link>
                    ) : null)}
                </div>

                <div className="w-full relative mt-8">
                    <div className="max-w-xl w-full mx-auto rounded-full shadow-red-700 dark:shadow-primary shadow-xl h-4" />
                    <div className="absolute -top-4 w-full max-w-7xl z-10 rounded-sm bg-light-background dark:bg-dark-background h-8 border-b !border-[#ddd] dark:!border-[#444]" />
                </div>

                <div className="w-full flex justify-start mx-auto flex-col items-start mt-8 gap-y-8 max-w-4xl">
                    <p className="w-full text-center italic text-muted dark:text-muted-dark">
                        ~ And other Boris Nezlobin productions ~
                    </p>
                    <SmallProjectListItem
                        link="https://x.com/b_nezlobin/status/1973213855754092749"
                        linkText="Let's go 600x faster than SunPy"
                        icon={<XLogoIcon />}
                        description="When the libraries are too slow, make polynomials. Empirically modelling solar differential rotation more accurately and a whole lot faster than SunPy."
                    />
                    <SmallProjectListItem
                        icon={<GithubLogoIcon />}
                        link="https://github.com/borisnezlobin/pomodoro"
                        linkText="YAPA — Yet Another Pomodoro App"
                        description="Free-to-use Electron-based Pomodoro app with a beautiful UI and Discord RPC. So your friends know you're working hard."
                    />
                    <SmallProjectListItem
                        icon={<ClockCounterClockwiseIcon className="rotate-[16deg]" />}
                        link="https://github.com/borisnezlobin/undodb"
                        linkText="UndoDB"
                        description="A small, no-SQL, in-memory, transaction-based database written in Java."
                    />
                </div>
            </main>
        </div>
    );
}
