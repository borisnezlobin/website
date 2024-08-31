import { LinkButton } from "components/buttons";
import Link from "next/link";
import { ScrollForMore } from "./components/landing/scroll-for-more";
import { Age } from "./components/landing/age";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Section } from "./components/landing/section";
import { LandingPageBadge } from "./components/landing/landing-page-badge";
import HorizontalScroll from "./components/landing/scroll-horizontal";
import getMetadata from "./lib/metadata";

export const metadata = getMetadata({
    info: "Hi, I'm",
});

const languages = [
    { title: "TypeScript" },
    { title: "Java" },
    { title: "C++" },
    { title: "Python" },
    { title: "C#" },
    { title: "Rust" },
    { title: "JavaScript" },
    { title: "HTML/CSS" },
]

const tech = [
    { title: "React" },
    { title: "React Native"},
    { title: "NextJS" },
    { title: "TailwindCSS" },
    { title: "Prisma + Postgres" },
    { title: "ElectronJS" },
    { title: "ExpressJS" },
];

const tools = [
    { title: "IDEs", description: "VSCode, CLion, IntelliJ, AS, and Zed are my favorites" },
    { title: "Jira / Slack", description: "Kuriosity Robotics Software Lead, '24-25" },
    { title: "Unity", description: "Game Engine" },
    { title: "Git", description: "" },
    { title: "Postman", description: "" },
    { title: "Docker", description: "" },
]

const projects = [
    { title: "OneShip", description: "A full-stack web and mobile application built for my school.", url: "/projects/oneship" },
    { title: "Portfolio", description: "My very own website :) Designed and built from the ground up by me.", url: "/projects/portfolio" },
    { title: "YAPA", description: "Yet Another (Electron) Pomodoro App (with nice UI). It has Discord RPC!", url: "https://github.com/borisnezlobin/pomodoro" },
    { title: "SpatOS", description: "My CS Capstone project — making a 2D Rust-based operating system 3-dimensional (WIP).", url: "/projects/spatos" },
    { title: "UndoDB", description: "A small, no-SQL, in-memory, transaction-based database written in Java.", url: "https://github.com/borisnezlobin/undodb" },
    { title: "Lim", description: "A Mozilla and Chrome RegEx-based time limit extension.", url: "/projects/lim" },
    { title: "ENF", description: "Collecting and analyzing European electrical network frequency data.", url: "/projects/enf" },
]

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" }
]

export default function Home() {
    return (
        <main className="flex flex-col justify-center items-start mb-16 p-4 lg:p-0">
            <div className="h-[100svh] relative top-[-3rem] items-center w-full flex flex-col justify-center p-4">
                <p className="text-base md:text-2xl">Hi, I&apos;m</p>
                <h1 className="text-3xl font-bold dark:text-dark edo text-center md:text-7xl">
                    Boris Nezlobin.
                </h1>
            </div>
            <ScrollForMore />
            <h2 className="text-xl sm:text-4xl font-bold text-left dark:text-dark">
                <Age />
            </h2>
            <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4">
                <p className="dark:text-dark text-left w-full">
                    I&apos;m an 11th grader at Palo Alto High School writing code for fun.
                    I make things, with a focus on increasing accessibility in data, knowledge, and code. I love open-source.
                    Read on to see my skills, or check out <Link className="link underline font-semibold" href="/blog">my blog</Link>,{" "}
                    <Link className="link underline font-semibold" href="/notes">lecture notes</Link>, or <Link className="link underline font-semibold" href="/projects">projects I&apos;ve worked on</Link>.<br />
                    <span className="w-full flex flex-row justify-start items-center h-full gap-8 mt-4">
                        <LinkButton href="/blog" className="">
                            Check out my blog
                        </LinkButton>
                        <Link className="hidden md:flex link underline flex-row justify-center font-semibold items-center gap-1" href="/projects">
                            Projects
                            <ArrowRight weight="bold" />
                        </Link>
                    </span>
                </p>
            </div>
            <Section
                id="1.0"
                title="Skills"
                description="Check out what I know! I'm always learning new things."
            >
                <h3 className="font-bold text-xl mt-4">
                    <span className="text-primary dark:text-primary-dark">
                        1.1
                    </span>
                    {" "}Languages
                </h3>
                <div className="w-full flex flex-wrap flex-row print:flex-col gap-4 mt-4">
                    {languages.map((e, i) => <LandingPageBadge
                            title={e.title}
                            description=""
                            key={`language ${i}`}
                        />
                    )}
                </div>
                <h3 className="font-bold text-xl mt-8">
                    <span className="text-primary dark:text-primary-dark">
                        1.2
                    </span>
                    {" "}Technologies
                </h3>
                <div className="w-full flex flex-wrap flex-row print:flex-col gap-4 print:gap-0 mt-4">
                    {tech.map((e, i) => <LandingPageBadge
                            description=""
                            title={e.title}
                            key={`skill ${i}`}
                        />
                    )}
                </div>

                <h3 className="font-bold text-xl mt-8">
                    <span className="text-primary dark:text-primary-dark">
                        1.3
                    </span>
                    {" "}Tools
                </h3>
                <div className="w-full flex flex-wrap flex-row items-center print:flex-col gap-4 print:gap-0 mt-4">
                    {tools.map((e, i) => <LandingPageBadge
                        title={e.title}
                        description={e.description}
                        key={`skill ${i}`}
                        />
                    )}
                </div>
            </Section>
            <Section
                id="2.0"
                title="My Work"
                description="My favorite projects. Most of them have writeups!"
            >
                <h3 className="font-bold text-xl mt-8">
                    <span className="text-primary dark:text-primary-dark">
                        2.1
                    </span>
                    {" "}Projects
                </h3>
                <div className="w-full flex flex-wrap flex-row print:flex-col gap-4 mt-4">
                    {projects.map((e, i) =>
                        <LandingPageBadge
                            titleClassName={"w-24 text-center"}
                            title={e.title}
                            description={e.description}
                            key={`project ${i}`}
                            url={e.url}
                        />
                    )}
                </div>
                
                <h3 className="font-bold text-xl mt-8">
                    <span className="text-primary dark:text-primary-dark">
                        2.2
                    </span>
                    {" "}Contributions
                </h3>
                <p className="my-3">
                    I&apos;ve contributed to a few open-source projects. Here are some of them:
                </p>
                <HorizontalScroll>
                    {contributions.map((e, i) =>
                        <LandingPageBadge
                            title={e.title}
                            description={e.description}
                            key={`contribution ${i}`}
                            url={e.url}
                            className={`inline-block w-max flex-shrink-0 flex-row items-center`}
                            index={i}
                        />
                    )}
                </HorizontalScroll>
            </Section>
        </main>
    );
}