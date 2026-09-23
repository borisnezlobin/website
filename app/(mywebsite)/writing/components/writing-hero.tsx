"use client";

import type { ArticleCategory } from "@/prisma/awooga/client";
import { InkscapeColoredSvg } from "@/app/utils/inkscape-colored-svg";
import { PosedWhale } from "@/app/components/whales/posed-whale";
import { invertsInDark, NEGATIVE_IN_DARK } from "@/app/components/whales/ink/ink-painter";
import { HERO_POSE, heroBodyStyle, heroFrameStyle } from "@/app/components/whales/hero-pose";
import RandomQuote from "./random-quote";

const SKETCH_CATEGORY: ArticleCategory = "CREATIVE";
const SKETCH_SPEED = 4200;

const INK_BY_CATEGORY: Record<ArticleCategory, string> = {
    TECHNICAL: "plain",
    CREATIVE: "plain",
    PERSONAL: "ranting",
};

// Both drawings hang off this one frame, so the sketch and the inked whale
// land on the same body rather than each carrying its own offsets.
const FRAME_BOX = [
    "[--whale-frame-left:-9%] [--whale-frame-width:46%] [--whale-frame-lift:-50%]",
    "lg:[--whale-frame-left:-23%] lg:[--whale-frame-width:59%] lg:[--whale-frame-lift:-44%]",
].join(" ");

type WritingHeroProps = {
    flourish: boolean;
    sliced: boolean;
    category: ArticleCategory;
    title?: string;
};

const WritingHero = ({ flourish, sliced, category, title }: WritingHeroProps) => {
    const sketched = category === SKETCH_CATEGORY;
    const ink = INK_BY_CATEGORY[category] ?? INK_BY_CATEGORY.TECHNICAL;
    const flip = invertsInDark(ink) ? "" : NEGATIVE_IN_DARK;

    return (
        <header className="relative">
            {title ? (
                <h1 className="text-3xl mt-8 mb-4">{title}</h1>
            ) : (
                <h1 className="text-3xl mt-8 mb-6 font-normal text-center">
                    My&nbsp;
                    <span className="text-5xl vectra relative">
                        Writing.
                        <InkscapeColoredSvg
                            strokeWidth={0.9}
                            speed={250}
                            path="/drawings/underline.svg"
                            color="var(--text-color)"
                            className="hidden md:block absolute w-[120%] top-[0.825em] left-0"
                            visible={flourish}
                        />
                    </span>
                </h1>
            )}

            <div className="relative">
                {!title && (
                    <div
                        className={`hidden md:block absolute z-10 top-0 print:hidden ${FRAME_BOX}`}
                        style={heroFrameStyle}
                    >
                        <InkscapeColoredSvg
                            path="/drawings/whale-sketch.svg"
                            color="var(--text-color)"
                            strokeWidth={5}
                            speed={SKETCH_SPEED}
                            visible={sketched}
                            className="absolute block h-auto"
                            style={heroBodyStyle}
                        />
                        {!sketched && (
                            <PosedWhale
                                style={ink}
                                behavior={HERO_POSE.behavior}
                                frame={HERO_POSE.frame}
                                tilt={0}
                                facing="right"
                                className={`${flip} absolute inset-0 block`}
                            />
                        )}
                    </div>
                )}
                <RandomQuote visible={flourish} sliced={sliced} />
            </div>
        </header>
    );
};

export default WritingHero;
