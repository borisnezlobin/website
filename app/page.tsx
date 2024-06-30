import { LinkButton } from "components/buttons";
import Link from "next/link";
import { ScrollForMore } from "./components/landing/scroll-for-more";
import { Age } from "./components/landing/age";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Section } from "./components/landing/section";
import { LandingPageBadge } from "./components/landing/landing-page-badge";

const skills = [
  { title: "TypeScript", description: "My go-to language for web projects" },
  { title: "Java", description: "Used for robotics and AP CSA" },
  { title: "Team Management", description: "Software Lead for Kuriosity Robotics, '24-25" },
  { title: "C++", description: "Used for competitive programming (USACO)" },
  { title: "Python", description: "First language I learned" },
  { title: "C#", description: "Game dev in Unity" },
  { title: "Rust", description: "Oh crab..." },
  { title: "JavaScript", description: "Everyone knows JavaScript" },
  { title: "Git", description: "Learned by contributing to open source" },
  { title: "Docker", description: "I like whales" },
  { title: "React", description: "Used for OneShip's frontend" },
  { title: "React Native", description: "The only way I know how to make mobile apps" },
  { title: "NextJS", description: "Powering this website" },
  { title: "TailwindCSS", description: "text-center p-4 font-bold" },
  { title: "ElectronJS", description: "Used in Chemistry class (instead of paying attention)" },
  { title: "Prisma + Postgres", description: "How else would I store my blogs?" },
  { title: "ExpressJS", description: "Always fun" },
  { title: "IDEs", description: "VSCode, VS, CLion, IntelliJ, AS, and Zed are my favorites"},
];

const projects = [
  { title: "OneShip", description: "A full-stack web and mobile application built for my school.", url: "https://paly.app" },
  { title: "Portfolio", description: "My very own website :) Designed and built from the ground up by me.", url: "https://bnezlobin.vercel.app" },
  { title: "Run4U", description: "A work-in-progress, full stack, run generating application for the 2024 Congressional App Challenge" },
  { title: "YAPA", description: "Yet Another (Electron) Pomodoro App (with nice UI). It has Discord RPC!", url: "https://github.com/borisnezlobin/pomodoro" },
  { title: "SpatOS", description: "WIP - Yikes! High schoolers trying to make spatial operating systems doesn't turn out well." },
  { title: "UndoDB", description: "A small, no-SQL, in-memory, transaction-based database written in Java.", url: "https://github.com/borisnezlobin/undodb" }
]

const contributions = [
  { title: "TypeHero", description: "Profanity filter, DevEx, and UI", url: "https://typehero.dev" },
  { title: "Overlayed", description: "", url: "https://overlayed.dev" },
  { title: "helloSystem OS", description: "System apps", url: "https://hellosystem.github.io/docs/" },
]

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-start mb-[30dvh] p-4 lg:p-0">
      <div className="w-full fixed z-10 top-0 left-0 p-4">
        <div className="flex flex-row justify-around w-full sm:w-1/2 items-center">
          <Link href={"/blog"} className="link">Blog.</Link>
          <Link href={"/projects"} className="link">Projects.</Link>
          <Link href={"/contact"} className="link">Contact.</Link>
        </div>
      </div>
      <div className="h-screen items-center w-full flex flex-col justify-center p-4">
        <p className="text-base md:text-2xl">Hi, I&apos;m</p>
        <h1 className="text-3xl font-bold dark:text-dark edo text-center md:text-7xl">
          Boris Nezlobin.
        </h1>
      </div>
      <ScrollForMore />
      <h2 className="text-xl sm:text-4xl mt-12 font-bold text-left dark:text-dark">
        <Age />
      </h2>
      <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4">
        <p className="dark:text-dark text-left w-full">
          I&apos;m an 11th grader at Palo Alto High School writing code for fun.
          My favorite technologies to work with are T3, Electron, React Native, and Unity.
          Read on to see my skills, or check out <Link className="link underline" href="/blog">my blog</Link>,{" "}
          <Link className="link underline" href="/resume">resume</Link>, or <Link className="link underline" href="/projects">projects I&apos;ve worked on</Link>.<br />
          <span className="w-full flex flex-row justify-start items-center h-full gap-8 mt-4">
            <LinkButton href="/blog" className="">
              Check out my blog
            </LinkButton>
            <Link className="hidden md:flex link underline flex-row justify-center items-center gap-1" href="/resume">
              Resume
              <ArrowRight />
            </Link>
          </span>
        </p>
      </div>
      <Section
        title="1.0 Skills"
        description=""
      >
        <div className="w-full flex flex-wrap flex-row gap-4">
          {skills.map((e, i) => <LandingPageBadge title={e.title} description={e.description} key={`skill ${i}`} />)}
        </div>
      </Section>
      <Section
        title="2.0 Projects"
        description="My favorite projects. Check out /projects for writeups on each!"
      >
        <div className="w-full flex flex-wrap flex-row gap-4 mt-4">
          {projects.map((e, i) => 
            <LandingPageBadge title={e.title} description={e.description} key={`project ${i}`} url={e.url} />
          )}
        </div>
      </Section>
    </main>
  );
}