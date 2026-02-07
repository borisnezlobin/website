"use client";

import { useRef } from "react";
import { FlagIcon, GameControllerIcon, UsersThreeIcon, WaveformIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";
import Link from "next/link";
import { Separator } from "../../separator";

const facts = [
    {
        icon: UsersThreeIcon,
        title: "Team Captain",
        description: "Heron Robotics, '25\u201326",
    },
    {
        icon: FlagIcon,
        title: "Software Lead",
        description: "Kuriosity Robotics, '24\u201325",
    },
    {
        icon: GameControllerIcon,
        title: "Drive Coach",
        description: "3 seasons lead driver \u2192 in-match strategy",
    },
    {
        icon: WaveformIcon,
        title: "Kalman Filters",
        description: "State estimation & autonomous navigation",
    },
];

export function RoboticistSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref);

    return (
        <section className="landing-section">
            <div
                ref={ref}
                className={`max-w-6xl relative mx-auto px-8 w-full flex flex-col md:flex-row gap-8 md:gap-12 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <div className="flex-1 flex flex-col gap-10">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-12">
                        <div className="flex flex-col items-start">
                            <span className="vectra text-[5rem] md:text-[10rem] leading-none text-primary">
                                3x
                            </span>
                            <div className="flex flex-col gap-1 mt-2">
                                <span className="text-xl md:text-2xl font-semibold">
                                    World Championship Qualifier
                                </span>
                                <span className="text-muted dark:text-muted-dark emph">
                                    &apos;23 &middot; &apos;24 &middot; &apos;25
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-row items-start gap-2">
                            <span className="text-muted dark:text-muted-dark">
                                Top
                            </span>
                            <span className="vectra text-[2rem] leading-none text-primary">
                                12
                            </span>
                            <span className="text-muted dark:text-muted-dark">
                                in the world (&apos;23)
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
                        <div className="flex flex-row gap-4">
                            <p>
                                Team Captain
                            </p>
                            <Link href="https://heronrobotics.vercel.app/" className="italic text-muted dark:text-muted-dark hover:underline hover:text-primary dark:hover:text-primary-dark">
                                Heron Robotics (&apos;25-26)
                            </Link>
                        </div>
                        <Separator className="hidden sm:flex" />
                        <div className="flex flex-row gap-4">
                            <p>
                                Software Lead + Robot Driver
                            </p>
                            <Link href="https://kuriosityrobotics.com/" className="italic text-muted dark:text-muted-dark hover:underline hover:text-primary dark:hover:text-primary-dark">
                                Kuriosity Robotics (&apos;22-25)
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <SectionLabel label="Roboticist" />
        </section>
    );
}
