"use client";

import { createGlyphShader } from "../lib/glyph/glyph-shader";
import { asciiMono } from "./creek-fonts";
import { GalleryCreek } from "./gallery-creek";

const WEIGHTS = [300, 400, 500, 600, 700];

export function GlyphShaderScene() {
    return <GalleryCreek engine={createGlyphShader} fontFamily={asciiMono.style.fontFamily} fontWeights={WEIGHTS} />;
}
