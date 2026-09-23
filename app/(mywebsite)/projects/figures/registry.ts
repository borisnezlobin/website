import type { FigureSpec } from "./types";
import { ameliaFigure } from "./amelia";
import { vantageFigure } from "./vantage";
import { sunFigure } from "./sun";
import { heronFigure } from "./heron";
import { enfFigure } from "./enf";
import { arborFigure } from "./arbor";

export const FIGURES = {
    amelia: ameliaFigure,
    vantage: vantageFigure,
    sun: sunFigure,
    heron: heronFigure,
    enf: enfFigure,
    arbor: arborFigure,
} satisfies Record<string, FigureSpec>;

export type FigureId = keyof typeof FIGURES;
