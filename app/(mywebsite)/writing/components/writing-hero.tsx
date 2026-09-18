"use client";

import type { ArticleCategory } from "@/prisma/awooga/client";
import { InkscapeColoredSvg } from "@/app/utils/inkscape-colored-svg";
import { PosedWhale } from "@/app/components/whales/posed-whale";
import { invertsInDark, NEGATIVE_IN_DARK } from "@/app/components/whales/ink/ink-painter";
import RandomQuote from "./random-quote";

const WHALE_POSE = { behavior: "roll_right", frame: 48, tilt: -6 };

const SKETCH_CATEGORY: ArticleCategory = "CREATIVE";
const SKETCH_SPEED = 4200;

const INK_BY_CATEGORY: Record<ArticleCategory, string> = {
    TECHNICAL: "plain",
    CREATIVE: "plain",
    PERSONAL: "ranting",
};

const SKETCH_BOX = "left-0 w-[29.9%] -translate-y-[40.7%] lg:left-[-11.5%] lg:w-[38.3%] lg:-translate-y-[21.7%]";
const WHALE_BOX = "left-[-9%] w-[46%] -translate-y-[50%] lg:left-[-23%] lg:w-[59%] lg:-translate-y-[44%]";

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
                    <>
                        <div className={`hidden md:block absolute z-10 top-0 print:hidden ${SKETCH_BOX}`}>
                            <InkscapeColoredSvg
                                path="/drawings/whale-sketch.svg"
                                color="var(--text-color)"
                                strokeWidth={5}
                                speed={SKETCH_SPEED}
                                visible={sketched}
                                className="block w-full h-auto"
                                style={{ transform: `rotate(${WHALE_POSE.tilt}deg)` }}
                            />
                        </div>
                        {!sketched && (
                            <div className={`${flip} hidden md:block absolute z-10 top-0 print:hidden ${WHALE_BOX}`}>
                                <PosedWhale
                                    style={ink}
                                    behavior={WHALE_POSE.behavior}
                                    frame={WHALE_POSE.frame}
                                    tilt={WHALE_POSE.tilt}
                                    facing="right"
                                    className="relative block w-full"
                                />
                            </div>
                        )}
                    </>
                )}
                <RandomQuote visible={flourish} sliced={sliced} />
            </div>
        </header>
    );
};

export default WritingHero;
