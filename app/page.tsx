
import { ArrowFatLineDown } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "components/buttons";
import Link from "next/link";
import { ScrollForMore } from "./components/landing/scroll-for-more";
import Image from "next/image";
import { Age } from "./components/landing/age";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
// import DynamicBackground from "./components/background";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-start mb-[30dvh] p-4 md:p-0">
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
      <div className="p-4">
        <h2 className="text-xl sm:text-4xl mt-12 font-bold text-left dark:text-dark">
          <Age />
        </h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-center mt-4">
          <p className="dark:text-dark text-left w-full">
            I&apos;m an 11th grader at Palo Alto High School writing code for fun.
            My favorite technologies to work with are T3, Electron, React Native, and Unity.
            Read on to see my skills, or check out <Link className="link underline" href="/blog">my blog</Link>,{" "}
            <Link className="link underline" href="/resume">resume</Link>, or <Link className="link underline" href="/projects">projects I've worked on</Link>.<br />
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
      </div>
    </main>
  );
}