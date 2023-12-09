import { LinkButton } from "components/buttons";
import Link from "next/link";
import DynamicBackground from "./components/background";

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-6xl font-bold text-left dark:text-dark">
        Boris Nezlobin
      </h1>
      <h2 className="text-4xl mt-4 font-bold text-left dark:text-dark">
        Hello, world!
      </h2>
      <p className="dark:text-dark text-left mt-2">
        This is a little website I made for myself, where I can post cool stuff
        I work on and show who I am to people who are interested. I also use it
        as a playground and a way to learn NextJS - check out my{" "}
        <Link href="/blog/learning-nextjs" className="link">blog post</Link>
        {" "}on this!
      </p>
      <LinkButton href="/blog" className="mt-4">Check out my blog</LinkButton>

      <DynamicBackground width={1000} height={1000} boxSize={50} />
    </main>
  )
}