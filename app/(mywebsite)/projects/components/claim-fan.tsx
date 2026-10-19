"use client";

import { useRef } from "react";
import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import { FOCUS_RING } from "@/app/components/action";
import type { ProjectClaim } from "../content/types";
import { cardDeg, fanBounds, LINE_EM, slotOf, tuckOpacity, type Fan } from "../fan/fan-geometry";
import { useFanLayout } from "../fan/use-fan-layout";
import { useFanSpring } from "../fan/use-fan-spring";
import { useFanTriggers } from "../fan/use-fan-triggers";
import { useReducedMotion } from "../lib/use-reduced-motion";
import { SlicedText } from "./sliced-text";

const TEXT = "text-light-foreground dark:text-dark-foreground";
/** Solid page colour, a little past the sides too, so the cards tuck away behind the anchor. */
const ANCHOR = `relative z-20 bg-background shadow-[-0.25em_0_0_var(--background),0.25em_0_0_var(--background)] ${TEXT}`;
/** Each claim keeps a 44px-tall target centred on its line; the cards start far enough apart that neighbours never overlap. */
const CARD_LINK = `prose-link relative transition-colors before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 ${FOCUS_RING}`;
const CARD_ARROW = "ml-1 inline-block text-primary transition-[opacity,transform] duration-[250ms] ease-in-out";
/** Under reduced motion the cards hold their fanned places and only fade. */
const STILL_FADE = "transition-opacity duration-150 ease-out";

type CardProps = { claim: ProjectClaim; deg: number; pivot: number; opacity: number; shown: boolean; still: boolean; cardRef: (card: HTMLLIElement | null) => void };

function ClaimCard({ claim, deg, pivot, opacity, shown, still, cardRef }: CardProps) {
    return (
        <li
            ref={cardRef}
            className={`absolute left-0 top-0 whitespace-nowrap ${still ? STILL_FADE : ""}`}
            style={{
                lineHeight: `${LINE_EM}em`,
                transformOrigin: `-${pivot}em ${LINE_EM / 2}em`,
                transform: `rotate(${deg}deg)`,
                opacity,
                pointerEvents: shown ? "auto" : "none",
            }}
        >
            <a href={`#${claim.id}`} className={CARD_LINK}>
                {claim.verb} {claim.noun}
                <span className="text-primary">.</span>
            </a>
            <ArrowDownIcon aria-hidden size="0.5em" className={`${CARD_ARROW} ${shown ? "opacity-100" : "-translate-x-0.5 opacity-0"}`} />
        </li>
    );
}

const angleOf = (card: number, open: number, fan: Fan, count: number) => cardDeg(slotOf(card, fan, count), open, fan, count);

/**
 * "I do stuff.", which fans out into the three claims, each linking down to its group of
 * projects. The claims are always in the page for screen readers and the keyboard; the fan only
 * decides whether they can be seen.
 */
export function ClaimFan({ claims, onCanopyFloor }: { claims: ProjectClaim[]; onCanopyFloor: (px: number) => void }) {
    const lineRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
    const still = useReducedMotion();
    const { fan, widths } = useFanLayout(lineRef, cardRefs, onCanopyFloor);
    const { fanned, box, anchor } = useFanTriggers(boxRef);
    const open = useFanSpring(fanned, !still);
    const cardOpen = still ? 1 : open;
    const bounds = fanBounds(fan, widths, still ? Number(fanned) : open);
    const degOf = (card: number) => angleOf(card, cardOpen, fan, claims.length);
    const opacityOf = (card: number) => (still ? Number(fanned) : tuckOpacity(widths[card] ?? 0, degOf(card), fan.pivot));

    return (
        <div ref={lineRef} className="relative text-3xl md:text-4xl" style={{ height: `${LINE_EM}em` }}>
            <div ref={boxRef} className="absolute left-0 top-0" style={{ width: `${bounds.width}em`, height: `${bounds.height}em` }} {...box}>
                <span aria-hidden className="absolute inset-x-0" style={{ top: `${-bounds.above}em`, height: `${bounds.above}em` }} />
                <p className={ANCHOR} style={{ height: `${LINE_EM}em`, lineHeight: `${LINE_EM}em` }}>
                    <SlicedText torn={fanned && !still} className="cursor-default" {...anchor}>
                        I do stuff<span className="text-primary">.</span>
                    </SlicedText>
                </p>
                <ul>
                    {claims.map((claim, card) => (
                        <ClaimCard
                            key={claim.id}
                            claim={claim}
                            deg={degOf(card)}
                            pivot={fan.pivot}
                            opacity={opacityOf(card)}
                            shown={fanned}
                            still={still}
                            cardRef={(element) => {
                                cardRefs.current[card] = element;
                            }}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}
