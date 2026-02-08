"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import Background from "../background";

type PhotoPreview = {
    title: string;
    image: string;
    slug: string;
};

const BACKGROUND_WORDS = ["artist", "photographer", "designer", "published"];

const PRINT_ROTATIONS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];
const PRINT_OFFSETS = ["translate-y-4", "-translate-y-2", "translate-y-6", "-translate-y-3"];

export function ArtistSection({ photos }: { photos: PhotoPreview[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const rawVisible = useIsVisible(ref);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);

    useEffect(() => {
        if (rawVisible) setHasBeenVisible(true);
    }, [rawVisible]);

    const isVisible = hasBeenVisible;
    const displayPhotos = photos.slice(0, 4);

    return (
        <>
            <section className="landing-section !overflow-hidden">
                <div
                    ref={ref}
                    className={`w-full flex flex-col gap-8 md:gap-12 transition-all duration-700 ${
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                >
                    <div className="flex flex-col items-center w-full bottom-8 relative">
                        <span className="vectra text-5xl md:text-8xl leading-none">
                            Photography
                        </span>
                        <p className="text-muted dark:text-muted-dark mt-4 max-w-2xl text-center px-8">
                            Up, down, yellow, blurred, and brown. I like taking pictures of things!
                        </p>
                    </div>
                </div>
                <Background words={BACKGROUND_WORDS} className="" />
                <SectionLabel label="Artist" />
            </section>

            {displayPhotos.length > 0 && (
                <div className="w-full max-w-5xl mx-auto px-8 py-8" style={{ perspective: "1200px" }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:-gap-4 place-items-center">
                        {displayPhotos.map((photo, i) => (
                            <PrintCard
                                key={photo.slug}
                                photo={photo}
                                rotation={PRINT_ROTATIONS[i % PRINT_ROTATIONS.length]}
                                offset={PRINT_OFFSETS[i % PRINT_OFFSETS.length]}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center w-full mt-4 mb-8">
                <Link href="/photography" className="text-primary font-semibold hover:underline flex items-center gap-2">
                    View all photos <ArrowRightIcon weight="bold" size={14} />
                </Link>
            </div>
        </>
    );
}

function PrintCard({ photo, rotation, offset }: {
    photo: PhotoPreview;
    rotation: string;
    offset: string;
}) {
    return (
        <div
            className={`${rotation} ${offset} group w-36 h-44 sm:w-44 sm:h-52 md:w-52 md:h-60 [perspective:800px] cursor-pointer`}
        >
            <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:rotate-0 group-hover:translate-y-0">
                {/* Front — the photo */}
                <div className="absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-hidden shadow-xl bg-white dark:bg-neutral-200 p-2 pb-6">
                    <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover rounded-sm"
                        loading="lazy"
                    />
                </div>

                {/* Back — the title */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-sm shadow-xl bg-white dark:bg-neutral-200 p-4 flex flex-col items-center justify-center">
                    <div className="w-full h-full border border-neutral-300 rounded-sm flex flex-col items-center justify-center gap-3 px-4">
                        <p className="vectra text-lg md:text-xl text-neutral-800 text-center leading-snug">
                            {photo.title}
                        </p>
                        <div className="w-8 h-px bg-neutral-300" />
                        <p className="text-xs text-neutral-500 emph">
                            Boris Nezlobin
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
