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
import { listToString } from "../utils/list-to-string";
import { NowPlaying } from "../components/landing/now-playing";

export const metadata = getMetadata({
    info: "Hi, I'm",
});

const languages = [
    {
        title: "TypeScript",
        icon: TypeScriptIcon,
        technologies: ["NextJS", "React", "Firebase", "TailwindCSS"],
        knowHowToDo: ["Web Development", "Full-Stack Development"]
    }, {
        title: "Java",
        icon: CoffeeIcon,
        technologies: ["Gradle"],
        knowHowToDo: ["FTC Robotics", "Reflections", "Annotations", "Networking"]
    }, {
        title: "Python",
        icon: FilePyIcon,
        technologies: ["NumPy", "Pandas", "Matplotlib", "OpenCV", "Multiprocessing"],
        knowHowToDo: ["Data Analysis", "Data Visualization", "Computer Vision", "Performance Optimization"]
    }, {
        title: "C and C++",
        icon: FileCppIcon,
        technologies: ["OpenMP", "OpenGL", "SDL2"],
        knowHowToDo: ["Parallel Programming", "3D Rendering", "Raytracing"]
    }, {
        title: "CSS/HTML",
        icon: CSSIcon,
        technologies: ["CSS", "NativeWind", "TailwindCSS"],
        knowHowToDo: ["Making cool effects", "Designing websites", "Making websites"]
    }, {
        title: "JavaScript",
        icon: JavaScriptIcon,
        technologies: ["React Native", "ElectronJS", "ExpressJS", "NodeJS"],
        knowHowToDo: ["Backend Development", "Desktop Applications", "Mobile Apps"]
    }
]

const tools = [
    { title: "Jira / Slack", description: "Robotics Software Lead, '24-26", icon: <SlackLogoIcon /> },
    { title: "Email", description: "Love using this.", icon: <EnvelopeIcon /> },
    { title: "Unity", description: "Game Engine", icon: <UnityIcon /> },
    { title: "C#", icon: <UnityIcon />, description: "3 years of game development" },
    { title: "Git", description: "", icon: <GitBranchIcon /> },
    { title: "Docker", description: "", icon: <ShippingContainerIcon /> },
    { title: "Postman", description: "" },
    { title: "ChatGPT", icon: <OpenAiLogoIcon /> },
    { title: "Rust" },
]

const projects = [
    { title: "ENF", description: "The only free and up-to-date European electrical network frequency data. Featured by Hack Club.", url: "/projects/enf" },
    { title: "The C.H.", description: "A VS Code extension that lets you style code comments. Highlight todos, fixmes, ideas—anything, really—in your code.", url: "https://marketplace.visualstudio.com/items?itemName=randomletters.the-comment-highlighter" },
    { title: "Lim", description: "Track your website usage and set daily limits. Delayed delete means you can't impulsively get around limits ;)", url: "/projects/lim" },
    { title: "rendr", description: "A 3D renderer and raytracer, both written in C, for my CS Capstone class.", url: "/projects/rendr" },
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
                <Background
                    words={['programmer', 'student', 'designer', 'redhead', 'researcher', 'writer', 'nerd']}
                    charsBetweenWords={6}
                />
            </div>
            <main className="pagepad flex flex-col justify-center items-start mb-16 print:block print:w-full print:max-w-full print:p-0 print:mb-2 print:pt-2 print:pb-2">
                <HiImBoris />
                <ScrollForMore className="print:hidden" />
                <h2 className="text-xl sm:text-3xl sm:text-[2rem] text-left print:mt-4 print:mb-2">
                    <AgeNoSSR /> <span className="vectra">years old</span>
                </h2>
                <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4 print:flex-col print:items-start print:m-0 print:gap-1">
                    <div className="text-left w-full print:mb-1 print:mt-1">
                        ...and counting! I&apos;m a 12th-grade student at Palo Alto High School writing code for fun—a lot of it. I interned at Lockheed Martin&apos;s Advanced Technology Center, where I got to solve a lot of cool problems, and I love using em dashes.
                        I also love making things. Four years in robotics, three in open-source contribution, and almost a decade of programming experience have led me to build a lot of cool things.<br /><br />
                        Read on to see my skills or check out <Link className="inlinelink" href="/blog">my blog</Link>,{" "}
                        <Link className="inlinelink" href="/notes">lecture notes</Link>, and <Link className="inlinelink" href="/projects">projects I&apos;ve worked on</Link>.<br />
                        <span className="w-full flex flex-row justify-start items-center h-full gap-8 mt-4 print:hidden">
                            <LinkButton href="/blog" className="">
                                Read my blog
                            </LinkButton>
                            <Link className="link hidden md:flex link underline flex-row justify-center font-semibold items-center" href="/projects">
                                <p>Projects</p>
                                <ArrowRightIcon weight="bold" />
                            </Link>
                        </span>
                    </div>
                </div>

                <Link href="/write" className="print:hidden w-full relative">
                    <section className="relative w-full group hover:scale-100 transition-transform duration-200 mt-12 p-4 py-8 md:p-8 md:py-12 bg-dark-background dark:bg-light-background">
                        <div className="group-hover:scale-x-125 z-[-1] group-hover:scale-y-105 !transition-transform !duration-200 absolute top-0 left-0 w-full h-full bg-dark-background dark:bg-light-background" />
                        <h1 className="text-2xl font-bold mb-2 text-dark-foreground dark:text-light-foreground">
                            <span className="text-dark-foreground dark:text-light-foreground md:hidden">Tap To </span>Try <span className="vectra text-dark-foreground dark:text-light-foreground">Wrisk.</span>
                        </h1>
                        <p className="text-dark-foreground dark:text-light-foreground">
                            Write until your time runs out or you hit your word count. You won&apos;t be able to stop. Literally :)
                        </p>
                    </section>
                </Link>
                <Section
                    id="1.0"
                    title="My Work"
                    description="Or, “What would happen if we gave a bored teenager Wi-Fi and a computer?”"
                    className="print:break-after-page print:mt-2 print:mb-2"
                >
                    <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1 sticky top-20 bg-light-background dark:bg-dark-background z-10">
                        <span className="text-primary">
                            1.1
                        </span>
                        {" "}Experience
                    </h3>
                    <div className="w-full flex flex-wrap flex-row print:flex-col print:w-full gap-4 print:gap-1 mt-4 print:mt-1 pr-4">
                        <div className="relative w-full">
                            <div className="text-lg">
                                <b>Software Lead</b><br />
                                <p className="ml-4 italic text-sm text-muted dark:text-muted-dark">Heron Robotics (2025-26), Kuriosity Robotics (2024-25)</p>
                            </div>
                            <p className="ml-4 flex flex-row gap-1 flex-wrap items-center" style={{ lineHeight: "2rem" }}>
                                Lead robot driver for the past three years; qualified to the World Championship in 2023, 2024, and 2025. Trying to win in 2026 :)
                            </p>
                        </div>
                        <div className="relative w-full">
                            <div className="text-lg">
                                <b>Chief Executive Officer & Founder</b><br />
                                <p className="ml-4 italic text-sm text-muted dark:text-muted-dark">Sendcraft (sendcraft.app)</p>
                            </div>
                            <p className="ml-4" style={{ lineHeight: "2rem" }}>
                                I want business cards like Mark Zuckerberg in <i>The Social Network</i>.
                            </p>
                        </div>
                        <div className="relative w-full">
                            <div className="text-lg">
                                <b>Software Engineering Intern</b><br />
                                <p className="ml-4 italic text-sm text-muted dark:text-muted-dark">
                                    Lockheed Martin, Solar & Astrophysics Laboratory
                                </p>
                            </div>
                            <div className="ml-4" style={{ lineHeight: "2rem" }}>
                                This was fun! I worked on solar data analysis, processing, and visualization in Python for solar physicists. Notably, I:
                                <ul className="ml-8 list-disc">
                                    <li>tracked solar features with OpenCV; reconstructed magnetic flux from detected polarity inversion lines (which cause solar flares).</li>
                                    <li>discovered memory leaks in C code and matplotlib, benchmarked solutions when applicable (it turns out that Numpy is faster than bare-minimum C code!).</li>
                                    <li>documented eight projects.</li>
                                    <li>delivered movie visualization tools for scientists to analyze solar data.</li>
                                </ul>

                                Also, I developed a memory-mapping approach for reading CSVs with monotonically indexed entries that works about 980x faster than Pandas. And I worked there given only a
                                2017 iMac with 8GB of RAM to process terabytes of data 
                                <span className="inline-flex flex-wrap">(<Link href="/blog/macports-with-proxy" className="underline link !inline">also, the proxy was slow and I couldn&apos;t install any packages</Link>).</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1 sticky top-20 bg-light-background dark:bg-dark-background z-10">
                        <span className="text-primary">
                            1.2
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
                    <p className="mt-4">
                        And, like, eight more on <Link href="/projects" className="link underline">my cool projects page</Link>!
                    </p>

                    <h3 className="font-bold text-xl mt-8 emph print:mt-2 print:mb-1 sticky top-20 bg-light-background dark:bg-dark-background z-10">
                        <span className="text-primary">
                            1.3
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
                <Section
                    id="2.0"
                    title="Skills"
                    description="I know lots of stuff. Some didn't make the list."
                    className="print:break-after-page print:mt-0 print:mb-2"
                >
                    <div className="flex flex-row items-center">
                        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-2">
                            {languages.map((lang, i) => {
                                const Icon = lang.icon;
                                return (
                                    <div
                                        key={`language-${i}`}
                                        className="relative flex flex-col md:flex-col items-start rounded-lg border dark:border-neutral-800 p-4"
                                    >
                                        <div className="absolute top-4 right-4 opacity-70">
                                            <Icon weight="fill" />
                                        </div>
                                        <div className="flex flex-row items-center gap-3 mb-3">
                                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                                {lang.title}
                                            </h2>
                                        </div>

                                        <div className="w-full flex flex-row gap-4">
                                            {lang.knowHowToDo && (
                                                <div className="mb-3">
                                                    <b className="block text-sm font-bold text-muted dark:text-muted-dark mb-1">
                                                        I’ve used {lang.title} for
                                                    </b>
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400 italic">
                                                        {lang.knowHowToDo.map((item, idx) => (
                                                            <li key={`use-${idx}`}>• {item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {lang.technologies && (
                                                <div className="flex flex-col gap-1 flex-1">
                                                    <div className="flex flex-col items-end gap-1 italic">
                                                        {lang.technologies.map((tech, idx) => (
                                                            <span
                                                                key={`tech-${idx}`}
                                                                className="px-2 py-[2px] text-sm rounded-md text-muted dark:text-muted-dark border border-neutral-300 dark:border-neutral-700"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <p className="mt-6 text-sm print:mt-1 print:mb-1">Also, some more stuff I thought worth mentioning:</p>
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
                <div className="w-full relative mt-8">
                    <div className="hidden md:block max-w-xl w-4/5 md:w-full mx-auto rounded-full shadow-red-700 dark:shadow-primary shadow-xl h-4" />
                    <div className="absolute -top-4 w-full max-w-7xl z-10 rounded-sm bg-light-background dark:bg-dark-background h-8 border-b !border-[#ddd] dark:!border-[#444]" />
                </div>
                <div className="w-full flex flex-col items-center justify-center mt-8 print:mt-2">
                    <p className="text-center italic text-muted dark:text-muted-dark">
                        You got to here and that&apos;s about it for now. Say hi!
                    </p>
                    <a href="/contact" className="link underline font-semibold mt-4 print:mt-1">
                        Contact Me
                    </a>
                </div>

                <NowPlaying />
            </main>
        </>
    );
}