
import { ArrowFatLineDown } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "components/buttons";
import Link from "next/link";
// import DynamicBackground from "./components/background";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-start mb-[30dvh]">
      <div className="h-screen flex flex-col justify-center items-start">
        <p className="text-2xl">Hi, I'm</p>
        <h1 className="text-7xl font-bold text-left dark:text-dark edo">
          Boris Nezlobin
        </h1>
      </div>
      <div className="absolute bottom-0 left-0 flex flex-col gap-2 justify-end items-center pb-2">
        <div className="flex flex-row justify-center items-center w-screen gap-4 text-muted dark:text-muted-dark">
          <p className="text-muted dark:text-muted-dark">Scroll for more</p>
          <ArrowFatLineDown size={24} weight="thin" />
        </div>
        <hr className="w-screen" />
      </div>
      <div>
        <h2 className="text-4xl mt-4 font-bold text-left dark:text-dark">
          Hello, world!
        </h2>
        <p className="dark:text-dark text-left mt-2">
          This is a little website I made for myself, where I can post cool stuff
          I work on and show who I am to people who are interested. I also use it
          as a playground and a way to learn NextJS! I don't write too often, but from time to time I love using it to procrastinate. Most articles on this website are either placeholders or written while under high stress from other work.
        </p>
      </div>
      <LinkButton href="/blog" className="mt-4">
        Check out my blog
      </LinkButton>
    </main>
  );
}
