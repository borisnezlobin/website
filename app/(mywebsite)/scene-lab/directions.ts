export type Direction = { slug: string; name: string };
export type Scene = { slug: "canopy" | "creek" | "space"; name: string; directions: Direction[] };

export const SCENES: Scene[] = [
    {
        slug: "canopy",
        name: "Canopy",
        directions: [
            { slug: "ink-willow", name: "Ink willow" },
            { slug: "weeping-cherry", name: "Weeping cherry" },
        ],
    },
    {
        slug: "creek",
        name: "Creek",
        directions: [
            { slug: "ascii-fluid", name: "ASCII fluid" },
            { slug: "text-river", name: "Text river" },
            { slug: "glyph-shader", name: "Glyph shader" },
        ],
    },
    {
        slug: "space",
        name: "Space",
        directions: [
            { slug: "ink-void", name: "Ink void" },
            { slug: "dark-neon", name: "Dark neon" },
            { slug: "dither-render", name: "Dither render" },
        ],
    },
];

export const directionHref = (scene: Scene["slug"], direction: string) => `/scene-lab/${scene}/${direction}`;
