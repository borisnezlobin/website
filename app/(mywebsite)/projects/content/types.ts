import type { FigureId } from "../figures/registry";

export type PlateLink = { label: string; href: string };

/** A highlight that names something won; it carries a medal on the page. */
export type PlateHighlight = string | { text: string; won: true };

export type PlateVisualSpec = { kind: "figure"; figure: FigureId } | { kind: "clients" };

export type PlateContent = {
    id: string;
    title: string;
    visual: PlateVisualSpec;
    highlights: PlateHighlight[];
    summary: string;
    links: PlateLink[];
};

export type IndexRow = {
    id: string;
    year: number;
    name: string;
    what: string;
    href?: string;
    /** Marks a row that won something; it carries the award mark on the page. */
    won?: true;
};
