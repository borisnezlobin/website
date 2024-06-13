
import { ArrowFatLineDown } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "components/buttons";
import Link from "next/link";
import { ScrollForMore } from "./components/scroll-for-more";
import Image from "next/image";
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
        <p className="text-2xl">Hi, I&apos;m</p>
        <h1 className="text-7xl font-bold text-left dark:text-dark edo">
          Boris Nezlobin.
        </h1>
      </div>
      <ScrollForMore />
      <div className="p-4">
        <h2 className="text-4xl mt-12 font-bold text-left dark:text-dark">
          Welcome!
        </h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-center">
          <p className="dark:text-dark text-left w-full">
            This is a little website I made for myself, where I can post cool stuff
            I work on and show who I am to people who are interested. I also use it
            as a playground and a way to learn NextJS! I don&apos;t write too often, but from time to time I love using it to procrastinate. Most articles on this website are either placeholders or written while under high stress from other work.<br />
            <LinkButton href="/blog" className="mt-4">
              Check out my blog
            </LinkButton>
          </p>
          <div className="relative w-full h-64">
            <Image src={"/website.svg"} alt="Welcome to my website" fill />
          </div>
        </div>
      </div>
    </main>
  );
}