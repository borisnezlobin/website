import { LinkButton } from "@/app/components/buttons";
import Link from "next/link";
import { ScrollForMore } from "../components/landing/scroll-for-more";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Section } from "../components/landing/section";
import { LandingPageBadge } from "../components/landing/landing-page-badge";
import HorizontalScroll from "../components/landing/scroll-horizontal";
import getMetadata from "../lib/metadata";
import dynamic from "next/dynamic";

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
    { title: "HTML/CSS*" },
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
    { title: "Unity", description: "Game Engine" },
    { title: "Git", description: "" },
    { title: "Postman", description: "" },
    { title: "Docker", description: "" },
    { title: "Jira / Slack", description: "Kuriosity Robotics Software Lead, '24-25" },
    { title: "Email", description: "love using this" }
]

const projects = [
    { title: "OneShip", description: "A full-stack web and mobile application built for my school.", url: "/projects/oneship" },
    { title: "The C.H.", description: "A VS Code extension that lets you style todos, fixmes, ideas, hacks — anything, really — in your code.", url: "https://marketplace.visualstudio.com/items?itemName=randomletters.the-comment-highlighter" },
    { title: "ENF", description: "Developing the methodology for the only up-to-date European electrical network frequency data.", url: "/projects/enf" },
    { title: "rendr", description: "A 3D renderer written in C, for fun (also a raytracer).", url: "/projects/rendr" },
    { title: "UndoDB", description: "A small, no-SQL, in-memory, transaction-based database written in Java.", url: "https://github.com/borisnezlobin/undodb" },
    { title: "Lim", description: "A Mozilla, RegEx-based website usage and limit extension.", url: "/projects/lim" },
    { title: "Portfolio", description: "My very own website :) Designed and built from the ground up by me.", url: "/projects/portfolio" },
    { title: "YAPA", description: "Yet Another (Electron) Pomodoro App (with nice UI). It has Discord RPC!", url: "https://github.com/borisnezlobin/pomodoro" },
];

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" }
]

import AgeNoSSR from "../components/landing/age-client-wrapper";

export default function Home() {
    return (
        <main className="flex flex-col justify-center items-start mb-16 p-4 lg:p-0 print:block print:w-full print:max-w-full print:p-0 print:mb-2 print:pt-2 print:pb-2">
            <div className="h-[100svh] relative top-[-3rem] items-center w-full flex flex-col justify-center p-4 print:h-auto print:relative print:top-0 print:p-0 print:mb-2">
                <p className="text-base md:text-2xl emph">Hi, I&apos;m</p>
                <h1 className="text-3xl font-bold dark:text-dark edo text-center md:text-7xl">
                    Boris Nezlobin.
                </h1>
            </div>
            <ScrollForMore className="print:hidden" />
            <h2 className="text-xl sm:text-3xl sm:text-[2rem] text-left dark:text-dark print:mt-4 print:mb-2">
                <AgeNoSSR /> years old
            </h2>
            <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4 print:flex-col print:items-start print:m-0 print:gap-1">
                <p className="dark:text-dark text-left w-full print:mb-1 print:mt-1">
                    ...and counting. I&apos;m a 12th grader at Palo Alto High School writing code for fun (and interning at Lockheed Martin&apos;s Advanced Technology Center!).
                    Read on to see my skills, or check out <Link className="link !underline font-semibold print:underline" href="/blog">my blog</Link>,{" "}
                    <Link className="link underline font-semibold print:underline" href="/notes">lecture notes</Link>, or <Link className="link underline font-semibold print:underline" href="/projects">projects I&apos;ve worked on</Link>.<br />
                    <span className="w-full flex flex-row justify-start items-center h-full gap-8 mt-4 print:hidden">
                        <LinkButton href="/blog" className="">
                            Check out my blog
                        </LinkButton>
                        <Link className="hidden md:flex link underline flex-row justify-center font-semibold items-center gap-1" href="/projects">
                            Projects
                            <ArrowRightIcon weight="bold" />
                        </Link>
                    </span>
                </p>
            </div>
            <Section
                id="1.0"
                title="Skills"
                description="Check out what I know! I'm always learning new things."
                className="print:break-after-page print:mt-0 print:mb-2"
            >
                <h3 className="font-bold text-xl mt-4 emph print:mt-2 print:mb-0">
                    <span className="text-primary dark:text-primary-dark">
                        1.1
                    </span>
                    {" "}Languages
                </h3>
                <div className="w-full flex flex-wrap flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                    {languages.map((e, i) => <LandingPageBadge
                            title={e.title}
                            description=""
                            key={`language ${i}`}
                        />
                    )}
                </div>
                <p className="mt-6 text-sm print:mt-1 print:mb-1">* is HTML really a language though?</p>
                <h3 className="font-bold text-xl mt-4 emph print:mt-3 print:mb-0">
                    <span className="text-primary dark:text-primary-dark">
                        1.2
                    </span>
                    {" "}Technologies
                </h3>
                <div className="w-full flex flex-wrap flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                    {tech.map((e, i) => <LandingPageBadge
                            description=""
                            title={e.title}
                            key={`tech ${i}`}
                        />
                    )}
                </div>

                <h3 className="font-bold text-xl mt-8 emph print:mt-3 print:mb-0">
                    <span className="text-primary dark:text-primary-dark">
                        1.3
                    </span>
                    {" "}Tools
                </h3>
                <div className="w-full flex flex-wrap items-center flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                    {tools.map((e, i) => <LandingPageBadge
                        title={e.title}
                        description={e.description}
                        key={`tools ${i}`}
                        />
                    )}
                </div>
            </Section>
            <Section
                id="2.0"
                title="My Work"
                description="My favorite projects. Most of them have writeups!"
                className="print:break-after-page print:mt-2 print:mb-2"
            >
                <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1">
                    <span className="text-primary dark:text-primary-dark">
                        2.1
                    </span>
                    {" "}Projects
                </h3>
                <div className="w-full flex flex-wrap flex-row print:flex-col print:w-full gap-4 print:gap-1 mt-4 print:mt-1 pr-4">
                    {projects.map((e, i) =>
                        <LandingPageBadge
                            titleClassName={"md:w-24 md:text-center"}
                            title={e.title}
                            description={e.description}
                            key={`project ${i}`}
                            url={e.url}
                        />
                    )}
                </div>
                
                <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1">
                    <span className="text-primary dark:text-primary-dark">
                        2.2
                    </span>
                    {" "}Contributions
                </h3>
                <p className="my-3 print:my-1">
                    I&apos;ve contributed to a few open-source projects. Here are some of them:
                </p>
                <div className="print:flex print:flex-col print:w-full print:gap-1">
                <HorizontalScroll className="print:hidden">
                    {contributions.map((e, i) =>
                        <LandingPageBadge
                            title={e.title}
                            description={e.description}
                            key={`contribution ${i}`}
                            url={e.url}
                            className={`inline-block w-max flex-shrink-0 flex-row items-center print:hidden`}
                            index={i}
                        />
                    )}
                </HorizontalScroll>
                {/* For print, show contributions in a simple list */}
                <ul className="hidden print:block print:pl-4 print:mb-2 print:mt-1">
                    {contributions.map((e, i) =>
                        <li key={`contribution-print-${i}`}> 
                            <span className="font-bold">{e.title}</span>
                            {e.description ? ` — ${e.description}` : ""}
                            {e.url ? (
                                <span> (<a href={e.url} className="underline">{e.url}</a>)</span>
                            ) : null}
                        </li>
                    )}
                </ul>
                </div>
            </Section>
        </main>
    );
}