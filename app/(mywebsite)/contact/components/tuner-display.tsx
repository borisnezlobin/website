"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MutableRefObject } from "react";
import { createSpinDrive } from "@/app/lib/spin-drive";
import { CHANNELS } from "../channels";
import { buildGlyphGrids, serializeIcons } from "../lib/glyph-masks";
import { prefersReducedMotion } from "../lib/reduced-motion";
import { advanceTuning, createTuning, tuningMasks, type Tuning } from "../lib/tuning-mask";

const WIDE_CELL = 9;
const NARROW_CELL = 7;
const WIDE_QUERY = "(min-width: 640px)";

type TunerDisplayProps = {
    positionRef: MutableRefObject<number>;
    station: number;
};

const isBetweenStations = (position: number) => Math.abs(position - Math.round(position)) > 1e-3;

export function TunerDisplay({ positionRef, station }: TunerDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const iconsRef = useRef<HTMLDivElement>(null);
    const tuning = useRef<Tuning>(createTuning(positionRef.current));
    const pendingSize = useRef("");
    const [gridsVersion, setGridsVersion] = useState(0);
    const cell = useDisplayCell();
    const stillKey = useStillKey(station, gridsVersion);

    useEffect(() => {
        const canvas = canvasRef.current, icons = iconsRef.current;
        if (!canvas || !icons) return;
        const svgs = serializeIcons(icons);
        const state = tuning.current;
        const { density, brightness } = tuningMasks(state, cell);
        const ensureGrids = (w: number, h: number) => {
            const size = `${w}x${h}@${cell}`;
            if (w < 1 || h < 1 || pendingSize.current === size) return;
            pendingSize.current = size;
            buildGlyphGrids(svgs, w, h, cell)
                .then((grids) => {
                    if (pendingSize.current !== size) return;
                    state.grids = grids;
                    setGridsVersion((version) => version + 1);
                })
                .catch(() => { pendingSize.current = ""; });
        };
        return createSpinDrive(canvas, density, {
            cell,
            brightness,
            beforeFrame: (w, h, t) => {
                state.position = positionRef.current;
                advanceTuning(state, t);
                ensureGrids(w, h);
            },
            eager: () => isBetweenStations(positionRef.current),
        });
    }, [cell, positionRef, stillKey]);

    return (
        <div aria-hidden="true" className="relative aspect-[4/3] w-full sm:aspect-[16/7]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            <div ref={iconsRef} hidden>
                {CHANNELS.map(({ id, icon: Glyph }) => <Glyph key={id} weight="fill" size={256} />)}
            </div>
        </div>
    );
}

// Under reduced motion the drive paints one still frame, so it is rebuilt whenever that frame would change.
function useStillKey(station: number, gridsVersion: number) {
    return prefersReducedMotion() ? `${station}:${gridsVersion}` : "live";
}

function subscribeToWidth(onChange: () => void) {
    const query = window.matchMedia(WIDE_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function useDisplayCell() {
    return useSyncExternalStore(
        subscribeToWidth,
        () => (window.matchMedia(WIDE_QUERY).matches ? WIDE_CELL : NARROW_CELL),
        () => WIDE_CELL,
    );
}
