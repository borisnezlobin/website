"use client";

import { useRef } from "react";
import { FlagIcon, GameControllerIcon, UsersThreeIcon, WaveformIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsVisible } from "@/app/utils/use-is-visible";
import { SectionLabel } from "./section-label";

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
        <section className="min-h-[100svh] flex flex-col justify-center print:hidden">
            <div
                ref={ref}
                className={`max-w-6xl mx-auto px-8 w-full flex flex-col md:flex-row gap-8 md:gap-12 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
                <SectionLabel label="Roboticist" />

                <div className="flex-1 flex flex-col gap-10">
                    <div className="flex flex-col items-start">
                        <span className="vectra text-[8rem] md:text-[10rem] leading-none text-primary">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {facts.map((fact) => {
                            const Icon = fact.icon;
                            return (
                                <div
                                    key={fact.title}
                                    className="flex items-start gap-4 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800"
                                >
                                    <Icon size={24} weight="duotone" className="text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold">{fact.title}</h3>
                                        <p className="text-muted dark:text-muted-dark text-sm mt-1">
                                            {fact.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
