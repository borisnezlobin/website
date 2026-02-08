import { ScrollForMore } from "../components/landing/scroll-for-more";
import getMetadata from "../lib/metadata";
import AgeNoSSR from "../components/landing/age-client-wrapper";
import { HiImBoris } from "../components/landing/hi-im-boris";
import { NowPlaying } from "../components/landing/now-playing";
import BoidBackground from "../components/landing/boids-client-wrapper";
import { WriterSection } from "../components/landing/sections/writer-section";
import { RoboticistSection } from "../components/landing/sections/roboticist-section";
import { ProgrammerSection } from "../components/landing/sections/programmer-section";
import { TechIconsRow } from "../components/landing/sections/tech-icons-row";
import { getBlogs, getPhotographs } from "../lib/db-caches";
import { ArtistSection } from "../components/landing/sections/artist-section";

export const metadata = getMetadata({
    info: "Hi, I'm",
});

export default async function Home() {
    const [articles, photographs] = await Promise.all([getBlogs(), getPhotographs()]);
    const previewArticles = articles.filter(e => !e.slug.includes("draft-") && !e.slug.includes("personal-")).slice(0, 3).map((a) => ({
        title: a.title,
        description: a.description ?? "",
        slug: a.slug,
        createdAt: a.createdAt,
    }));
    const previewPhotos = photographs.slice(0, 8).map((p) => ({
        title: p.title,
        image: p.image,
        slug: p.slug,
    }));

    return (
        <>
            <div className="hidden md:block">
                <BoidBackground />
            </div>
            <main className="select-text flex flex-col items-start print:block print:w-full print:max-w-full print:p-0 print:mb-2 print:pt-2 print:pb-2 mb-24">
                <div className="max-w-6xl mx-auto px-8 w-full">
                    <HiImBoris />
                    <ScrollForMore className="print:hidden" />
                    <h2 className="text-xl sm:text-3xl sm:text-[2rem] text-left print:mt-4 print:mb-2">
                        <AgeNoSSR /> <span className="vectra">years old</span>
                    </h2>
                    <p className="max-w-3xl text-muted dark:text-muted-dark">
                        ...and counting. I&apos;m a senior in high school. I occupy myself with things I find interesting, which means I&apos;m usually writing, programming, or building robots.
                    </p>
                </div>

                <ProgrammerSection />
                <TechIconsRow />
                <RoboticistSection />
                <WriterSection articles={previewArticles} />
                <ArtistSection photos={previewPhotos} />
                <NowPlaying />
            </main>
        </>
    );
}
