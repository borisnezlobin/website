"use client";

import { useCallback, useRef } from "react";
import { PROJECT_MEDIA } from "@/app/(mywebsite)/projects/content/media";
import type { FloatingLayer, FloatingLayerSource } from "../lib/floating-layer";
import { CreekCanvas, type CreekEngine } from "./creek-canvas";
import { PrintGallery } from "./print-gallery";

export type GalleryCreekEngine = (canvas: HTMLCanvasElement, options: { fontFamily: string; floats: FloatingLayerSource }) => CreekEngine;

type GalleryCreekProps = { engine: GalleryCreekEngine; fontFamily: string; fontWeights: number[] };

/** A creek direction with the robotics prints floating on its water. */
export function GalleryCreek({ engine, fontFamily, fontWeights }: GalleryCreekProps) {
    const layerRef = useRef<FloatingLayer | null>(null);
    const create = useCallback(
        (canvas: HTMLCanvasElement, family: string) => engine(canvas, { fontFamily: family, floats: () => layerRef.current }),
        [engine],
    );
    return (
        <>
            <CreekCanvas fontFamily={fontFamily} fontWeights={fontWeights} create={create} />
            <PrintGallery items={PROJECT_MEDIA.robotics} label="Robotics photos and videos" layerRef={layerRef} />
        </>
    );
}
