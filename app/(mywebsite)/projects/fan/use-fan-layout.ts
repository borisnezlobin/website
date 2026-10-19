"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { fanBounds, fitFan, LINE_EM, OVERSHOOT_OPEN, type Fan, type Room } from "./fan-geometry";

/** Breathing room kept below the fan. */
const FAN_MARGIN_PX = 16;
/** Sideways the cards may swing into part of the page's gutter, as they do on me.alaramartin.com. */
const FAN_SIDE_MARGIN_PX = FAN_MARGIN_PX / 4;
/** The fan may rise no higher than this share of the hero, so the canopy keeps the top of the screen. */
const FAN_CEILING_SHARE = 0.6;
/** Clear space between the lowest blossom and the fan's highest card. */
const CANOPY_CLEARANCE_PX = 32;

export type FanLayout = { fan: Fan; widths: number[] };

const INITIAL: FanLayout = { fan: { deg: 6, pivot: 10, below: 1 }, widths: [] };

function measureRoom(line: HTMLElement, hero: HTMLElement, em: number): Room & { top: number } {
    const lineBox = line.getBoundingClientRect();
    const heroBox = hero.getBoundingClientRect();
    const top = lineBox.top - heroBox.top;
    const left = lineBox.left - heroBox.left;
    const ceiling = hero.clientHeight * FAN_CEILING_SHARE + CANOPY_CLEARANCE_PX;
    return {
        top,
        up: (top - ceiling) / em,
        down: (hero.clientHeight - FAN_MARGIN_PX - top) / em - LINE_EM,
        left: (left - FAN_SIDE_MARGIN_PX) / em,
        right: (hero.clientWidth - FAN_SIDE_MARGIN_PX - left) / em,
    };
}

/**
 * Sizes the fan to the room between the canopy and the hero's edges, and reports how low the
 * canopy may hang so the fully open fan, overshoot included, never sits on a blossom.
 */
export function useFanLayout(lineRef: RefObject<HTMLElement | null>, cardRefs: RefObject<(HTMLElement | null)[]>, onCanopyFloor: (px: number) => void) {
    const [layout, setLayout] = useState<FanLayout>(INITIAL);

    useLayoutEffect(() => {
        const line = lineRef.current;
        const hero = line?.closest("section");
        if (!line || !hero) return;
        const measure = () => {
            const em = parseFloat(getComputedStyle(line).fontSize);
            const widths = cardRefs.current.map((card) => (card ? card.offsetWidth / em : 4));
            const room = measureRoom(line, hero, em);
            const fan = fitFan(widths, room, em);
            onCanopyFloor(room.top - fanBounds(fan, widths, OVERSHOOT_OPEN).above * em - CANOPY_CLEARANCE_PX);
            setLayout({ fan, widths });
        };
        measure();
        const resize = new ResizeObserver(measure);
        resize.observe(hero);
        document.fonts?.ready.then(measure);
        return () => resize.disconnect();
    }, [lineRef, cardRefs, onCanopyFloor]);

    return layout;
}
