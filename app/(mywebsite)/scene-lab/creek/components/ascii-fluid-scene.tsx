"use client";

import { createAsciiFluid } from "../lib/ascii/ascii-fluid";
import { asciiMono } from "./creek-fonts";
import { GalleryCreek } from "./gallery-creek";

const WEIGHTS = [300, 400, 500, 600, 700];

export function AsciiFluidScene() {
    return <GalleryCreek engine={createAsciiFluid} fontFamily={asciiMono.style.fontFamily} fontWeights={WEIGHTS} />;
}
