"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import Background from "../background";
import { PrintCard, getPrintTransform } from "../print-card";
import type { PrintCardPhoto } from "../print-card";

const BACKGROUND_WORDS = ["artist", "photographer", "designer", "published"];

export function ArtistSection({ photos }: { photos: PrintCardPhoto[] }) {
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
                        {displayPhotos.map((photo, i) => {
                            const { rotation, offset } = getPrintTransform(i);
                            return (
                                <PrintCard
                                    key={photo.slug}
                                    photo={photo}
                                    rotation={rotation}
                                    offset={offset}
                                    className="w-36 h-44 sm:w-44 sm:h-52 md:w-52 md:h-60"
                                />
                            );
                        })}
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
