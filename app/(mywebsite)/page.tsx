import { LinkButton } from "@/app/components/buttons";
import Link from "next/link";
import { ScrollForMore } from "../components/landing/scroll-for-more";
import { ArrowRightIcon, AtomIcon, BalloonIcon, EnvelopeIcon, GitBranchIcon, OpenAiLogoIcon, ShippingContainerIcon, SlackLogoIcon, TriangleIcon } from "@phosphor-icons/react/dist/ssr";
import { Section } from "../components/landing/section";
import { LandingPageBadge } from "../components/landing/landing-page-badge";
import HorizontalScroll from "../components/landing/scroll-horizontal";
import getMetadata from "../lib/metadata";
import AgeNoSSR from "../components/landing/age-client-wrapper";
import Background from "../components/landing/background";
import { HiImBoris } from "../components/landing/hi-im-boris";
import { CoffeeIcon, FileCppIcon, FilePyIcon } from "@phosphor-icons/react/dist/ssr";
import { CSSIcon, JavaScriptIcon, TypeScriptIcon, UnityIcon } from "../components/lucide-imports";

export const metadata = getMetadata({
    info: "Hi, I'm",
});

const languages = [
    { title: "TypeScript", icon: <TypeScriptIcon /> },
    { title: "Java", icon: <CoffeeIcon /> },
    { title: "Python", icon: <FilePyIcon /> },
    { title: "C++", icon: <FileCppIcon /> },
    { title: "HTML/CSS*", icon: <CSSIcon /> },
    { title: "JavaScript", icon: <JavaScriptIcon /> },
    { title: "C#" },
    { title: "Rust" },
]

const tech = [
    { title: "React", icon: <AtomIcon /> },
    { title: "React Native", icon: <AtomIcon /> },
    { title: "NextJS", icon: <TriangleIcon weight="fill" /> },
    { title: "TailwindCSS" },
    { title: "Prisma + Postgres" },
    { title: "ElectronJS" },
    { title: "ExpressJS" },
];

const tools = [
    { title: "Jira / Slack", description: "Robotics Software Lead, '24-26", icon: <SlackLogoIcon /> },
    { title: "Email", description: "Love using this.", icon: <EnvelopeIcon /> },
    { title: "Unity", description: "Game Engine", icon: <UnityIcon /> },
    { title: "Git", description: "", icon: <GitBranchIcon /> },
    { title: "Docker", description: "", icon: <ShippingContainerIcon /> },
    { title: "Postman", description: "" },
    { title: "ChatGPT", icon: <OpenAiLogoIcon /> }
]

const projects = [
    { title: "ENF", description: "Developing the methodology for the only up-to-date European electrical network frequency data. Featured by Hack Club.", url: "/projects/enf" },
    { title: "The C.H.", description: "A VS Code extension that lets you style todos, fixmes, ideas, hacks—anything, really—in your code.", url: "https://marketplace.visualstudio.com/items?itemName=randomletters.the-comment-highlighter" },
    { title: "OneShip", description: "A full-stack web and mobile application built for my school.", url: "/projects/oneship" },
    { title: "Lim", description: "Track your website usage and set daily limits. Delayed delete means you can't impulsively get around limits ;)", url: "/projects/lim" },
    { title: "rendr", description: "A 3D renderer and raytracer, both written in C, for my CS Capstone class.", url: "/projects/rendr" },
    { title: "Portfolio", description: "My corner of the internet. Mine.", url: "/projects/portfolio" },
];

const contributions = [
    { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
    { title: "Overlayed", description: "", url: "https://overlayed.dev" },
    { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
    { title: "ShadowFinder", description: "CLI Caching", url: "https://github.com/bellingcat/ShadowFinder" }
]

export default function Home() {
    return (
        <>
            <div className="hidden md:block">
                <Background />
            </div>
            <main className="pagepad flex flex-col justify-center items-start mb-16 print:block print:w-full print:max-w-full print:p-0 print:mb-2 print:pt-2 print:pb-2">
                <HiImBoris />
                <ScrollForMore className="print:hidden" />
                <h2 className="text-xl sm:text-3xl sm:text-[2rem] text-left print:mt-4 print:mb-2">
                    <AgeNoSSR /> years old
                </h2>
                <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4 print:flex-col print:items-start print:m-0 print:gap-1">
                    <p className="text-left w-full print:mb-1 print:mt-1">
                        ...and counting. I&apos;m a 12th-grade student at Palo Alto High School writing code for fun—a lot of it. I interned at Lockheed Martin&apos;s Advanced Technology Center, where I got to solve a lot of cool problems, and I love using em dashes.
                        I also love making things. Four years in robotics, three in open-source contribution, and almost a decade of programming experience have lead me to build a lot of cool things.
                        Read on to see my skills or check out <Link className="link !underline font-semibold print:underline" href="/blog">my blog</Link>,{" "}
                        <Link className="link underline" href="/notes">lecture notes</Link>, and <Link className="link underline" href="/projects">projects I&apos;ve worked on</Link>.<br />
                        <span className="w-full flex flex-row justify-start items-center h-full gap-8 mt-4 print:hidden">
                            <LinkButton href="/blog" className="">
                                Check out my blog
                            </LinkButton>
                            <Link className="hidden md:flex link underline flex-row justify-center font-semibold items-center gap-1 link" href="/projects">
                                Projects
                                <ArrowRightIcon weight="bold" />
                            </Link>
                        </span>
                    </p>
                </div>
                <Link href="/write" className="w-full relative">
                    <section className="relative w-full group hover:scale-100 transition-transform duration-200 mt-12 p-4 py-8 md:p-8 md:py-12 bg-dark-background dark:bg-light-background">
                        <div className="group-hover:scale-x-125 z-[-1] group-hover:scale-y-105 !transition-transform !duration-200 absolute top-0 left-0 w-full h-full bg-dark-background dark:bg-light-background" />
                        <h1 className="text-2xl font-bold mb-2 text-dark-foreground dark:text-light-foreground">
                            <span className="text-dark-foreground dark:text-light-foreground md:hidden">Click To </span>Try Wrisk.
                        </h1>
                        <p className="text-dark-foreground dark:text-light-foreground">
                            Write until your time runs out or you hit your word count. You won&apos;t be able to stop. Literally :)
                        </p>
                    </section>
                </Link>
                <Section
                    id="1.0"
                    title="Skills"
                    description="Check out what I know! I'm always learning new things."
                    className="print:break-after-page print:mt-0 print:mb-2"
                >
                    <h3 className="font-bold text-xl mt-4 emph print:mt-2 print:mb-0">
                        <span className="text-primary">
                            1.1
                        </span>
                        {" "}Languages ({languages.length} of them)
                    </h3>
                    <div className="w-full flex flex-wrap flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                        {languages.map((e, i) => <LandingPageBadge
                                title={e.title}
                                description=""
                                icon={e.icon}
                                key={`language ${i}`}
                            />
                        )}
                    </div>
                    <p className="mt-6 text-sm print:mt-1 print:mb-1">* is HTML really a language though?</p>
                    <h3 className="font-bold text-xl mt-4 emph print:mt-3 print:mb-0">
                        <span className="text-primary">
                            1.2
                        </span>
                        {" "}Technologies
                    </h3>
                    <div className="w-full flex flex-wrap flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                        {tech.map((e, i) => <LandingPageBadge
                                description=""
                                title={e.title}
                                icon={e.icon}
                                key={`tech ${i}`}
                            />
                        )}
                    </div>

                    <h3 className="font-bold text-xl mt-8 emph print:mt-3 print:mb-0">
                        <span className="text-primary">
                            1.3
                        </span>
                        {" "}Tools
                    </h3>
                    <div className="w-full flex flex-wrap items-center flex-row gap-4 print:gap-1 print:items-start print:flex-row print:w-full mt-4 print:mt-0">
                        {tools.map((e, i) => <LandingPageBadge
                                title={e.title}
                                description={e.description || ""}
                                icon={e.icon}
                                key={`tools ${i}`}
                            />
                        )}
                    </div>
                </Section>
                <Section
                    id="2.0"
                    title="My Work"
                    description="Or, “What would happen if we gave a bored teenager Wi-Fi and a computer?”"
                    className="print:break-after-page print:mt-2 print:mb-2"
                >
                    <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1">
                        <span className="text-primary">
                            2.1
                        </span>
                        {" "}Experience
                    </h3>
                    <div className="w-full flex flex-wrap flex-row print:flex-col print:w-full gap-4 print:gap-1 mt-4 print:mt-1 pr-4">
                        <div className="relative w-full">
                            <p className="text-lg text-muted dark:text-muted-dark"><b>Software Lead</b>, Heron Robotics (2025-2026), Kuriosity Robotics (2024-2025)</p>
                            <p className="ml-2 flex flex-row gap-1 items-center" style={{ lineHeight: "2rem" }}>
                                Qualified to the world championship in 2025. Planning to win in 2026. <BalloonIcon />
                            </p>
                        </div>
                        <div className="relative w-full">
                            <p className="text-lg text-muted dark:text-muted-dark"><b>Chief Executive Officer & Founder</b>, Sendcraft</p>
                            <p className="ml-2" style={{ lineHeight: "2rem" }}>
                                I want business cards like Mark Zuckerberg in <i>The Social Network</i>.
                            </p>
                        </div>
                        <div className="relative w-full">
                            <p className="text-lg text-muted dark:text-muted-dark"><b>Software Engineering Intern</b>, Lockheed Martin Advanced Technology Center</p>
                            <p className="ml-2" style={{ lineHeight: "2rem" }}>
                                <ul className="ml-8 list-disc">
                                    <li>tracked solar features with OpenCV; reconstructed magnetic flux from computer-tracked polarity inversion lines, which cause solar flares.</li>
                                    <li>discovered memory leaks in C code and matplotlib, benchmarked solutions when applicable (it turns out that Numpy is faster than parallelized, single-instruction C code!).</li>
                                    <li>documented eight projects.</li>
                                    <li>delivered movie visualization tools for scientists to analyze solar data.</li>
                                </ul>

                                Also, I developed a memory-mapping approach for reading CSVs with monotonically indexed entries that works about 980x faster than Pandas. And I did all that on a
                                2017 iMac with 8GB of RAM (<Link href="/blog/macports-with-proxy" className="underline">also the proxy was slow and I didn&apos;t have homebrew</Link>).
                            </p>
                        </div>
                    </div>
                    <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1">
                        <span className="text-primary">
                            2.2
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
                        <span className="text-primary">
                            2.3
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
        </>
    );
}