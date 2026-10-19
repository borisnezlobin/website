"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createCanopy, type Canopy } from "../canopy/canopy-engine";
import { WEEPING_CHERRY } from "../canopy/cherry/look";
import type { SceneSize } from "../canopy/scene-loop";
import type { ProjectClaim } from "../content/types";
import { CanopyHero } from "./canopy-hero";

/** Where the canopy stops before the fan has measured itself, as a share of the hero. */
const DEFAULT_FLOOR_SHARE = 0.6;

function startCanopy(canvas: HTMLCanvasElement, floor: RefObject<number | null>): Canopy | null {
    try {
        return createCanopy(canvas, WEEPING_CHERRY, { floor: (size: SceneSize) => floor.current ?? size.height * DEFAULT_FLOOR_SHARE });
    } catch {
        return null;
    }
}

/** Runs the tree on the hero's canvas and rebuilds it whenever the fan's room above moves its floor. */
function useCanopy(canvasRef: RefObject<HTMLCanvasElement | null>) {
    const canopyRef = useRef<Canopy | null>(null);
    const floorRef = useRef<number | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canopy = startCanopy(canvas, floorRef);
        if (!canopy) {
            setFailed(true);
            return;
        }
        canopyRef.current = canopy;
        return () => {
            canopy.dispose();
            canopyRef.current = null;
        };
    }, [canvasRef]);

    const setFloor = useCallback((px: number) => {
        if (floorRef.current === px) return;
        floorRef.current = px;
        canopyRef.current?.relayout();
    }, []);

    return { failed, setFloor };
}

/** The projects page's first screen: a dithered weeping cherry over "I do stuff." and its fan of claims. */
export function ProjectHero({ claims }: { claims: ProjectClaim[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { failed, setFloor } = useCanopy(canvasRef);
    return <CanopyHero claims={claims} canvasRef={canvasRef} plain={failed} onCanopyFloor={setFloor} />;
}
