import { LinkButton, PrimaryButton, SecondaryButton } from "components/buttons";
import SocialLinksBubble from "@/components/social-links";
import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full min-h-screen p-8 bg-light-background dark:bg-dark-background">
      {/* <PrimaryButton>Click me</PrimaryButton> */}
      <h1 className="text-4xl font-bold text-left dark:text-dark">
        Hello, world!
      </h1>
      <p className="dark:text-dark text-left mt-2">
        This is a little website I made for myself, where I can post cool stuff
        I work on and show who I am to people who are interested. I also use it
        as a playground and a way to learn NextJS - check out my{" "}
        <Link href="/blog/learning-nextjs" className="link">blog post</Link>
        {" "}on this!
      </p>
      <LinkButton href="/blog" className="mt-4">Check out my blog</LinkButton>
      {/* <div className="flex flex-row gap-4 mt-8">
        <LinkButton direction="left">Back</LinkButton>
        <PrimaryButton>Submit</PrimaryButton>
        <SecondaryButton>Cancel</SecondaryButton>
      </div> */}
    </main>
  )
}