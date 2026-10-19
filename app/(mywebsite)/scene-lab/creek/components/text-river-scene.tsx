"use client";

import { createTextRiverScene } from "../lib/river/text-river";
import { riverMono } from "./creek-fonts";
import { GalleryCreek } from "./gallery-creek";

const WEIGHTS = [400, 500];

export function TextRiverScene() {
    return <GalleryCreek engine={createTextRiverScene} fontFamily={riverMono.style.fontFamily} fontWeights={WEIGHTS} />;
}
