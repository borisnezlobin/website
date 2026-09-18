import BoidBackground from "@/app/components/landing/boids-client-wrapper";
import { HiImBoris } from "@/app/components/landing/hi-im-boris";
import AgeNoSSR from "@/app/components/landing/age-client-wrapper";
import { ScrollForMore } from "@/app/components/landing/scroll-for-more";
import { Abbreviation } from "@/app/components/abbreviation";
import { ProgrammerSection } from "@/app/components/landing/sections/programmer-section";
import { TechIconsRow } from "@/app/components/landing/sections/tech-icons-row";
import { RoboticistSection } from "@/app/components/landing/sections/roboticist-section";
import { WriterSection } from "@/app/components/landing/sections/writer-section";
import { ArtistSection } from "@/app/components/landing/sections/artist-section";
import { WhaleBand, WhaleClimb } from "@/app/components/whales/whale-band";
import { getBlogs, getPhotographs } from "@/app/lib/db-caches";
import getMetadata from "@/app/lib/metadata";
import Link from "next/link";

export const metadata = getMetadata({});

const ENTRY_DELAY_SECONDS = { opening: 0, climb: 4, closing: 8 };

export default async function Home() {
    const [articles, photographs] = await Promise.all([getBlogs(), getPhotographs()]);
    const previewArticles = articles
        .filter((a) => a.category === "TECHNICAL")
        .slice(0, 3)
        .map((a) => ({ title: a.title, description: a.description ?? "", slug: a.slug, createdAt: a.createdAt }));
    const previewPhotos = photographs
        .filter((p: any) => p.inGallery !== false)
        .slice(0, 8)
        .map((p) => ({ title: p.title, image: p.image, slug: p.slug }));

    return (
        <>
            <div className="hidden md:block">
                <BoidBackground />
            </div>
            <main className="select-text flex flex-col items-start mb-32 print:block print:w-full print:max-w-full print:p-0 print:mb-2 print:pt-2 print:pb-2">
                <div className="max-w-6xl mx-auto px-8 w-full">
                    <HiImBoris />
                    <ScrollForMore className="print:hidden" />
                    <h2 className="text-xl sm:text-3xl text-left mt-16 md:mt-24 print:mt-4 print:mb-2">
                        <AgeNoSSR /> <span className="vectra">years old</span>
                    </h2>
                    <p className="max-w-3xl mt-4">
                        ...and counting. I’m a student at <span className="text-[#FDB414] bg-[#002676] dark:text-[#022675] dark:bg-[#FDB414] px-2 py-1 rounded text-xs">
                            UC <span className="font-semibold text-[#FDB414] dark:text-[#022675]">Berkeley</span>
                        </span> studying Applied Mathematics &{" "}
                            <Abbreviation label="Industrial Engineering & Operations Research">IEOR</Abbreviation>. You&rsquo;ll find me writing code, designing cool things, <Link href="/photography" className="link">taking photos</Link>,
                            or writing.
                    </p>
                </div>

                <div className="mt-24 md:mt-32 w-full">
                    <WhaleBand style="plain" entryDelaySeconds={ENTRY_DELAY_SECONDS.opening} />
                </div>

                <ProgrammerSection />
                <TechIconsRow />

                <WhaleClimb style="plain" direction="up" heading="left" entryDelaySeconds={ENTRY_DELAY_SECONDS.climb}>
                    <RoboticistSection />
                </WhaleClimb>

                <WriterSection articles={previewArticles} />

                <WhaleBand style="plain" entryDelaySeconds={ENTRY_DELAY_SECONDS.closing} />

                <ArtistSection photos={previewPhotos} />
            </main>
        </>
    );
}
