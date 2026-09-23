import type { FigureId } from "../figures/registry";

export type PlateLink = { label: string; href: string };

export type PlateVisualSpec = { kind: "figure"; figure: FigureId } | { kind: "clients" };

export type PlateContent = {
    id: string;
    title: string;
    visual: PlateVisualSpec;
    highlights: string[];
    summary: string;
    links: PlateLink[];
};

export type IndexRow = {
    id: string;
    year: number;
    name: string;
    what: string;
    href?: string;
};
