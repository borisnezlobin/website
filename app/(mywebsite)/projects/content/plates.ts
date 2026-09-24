import type { PlateContent } from "./types";

export const PLATES: PlateContent[] = [
    {
        id: "lockheed",
        title: "Lockheed Martin",
        visual: { kind: "figure", figure: "sun" },
        highlights: ["Solar flare prediction", "980x faster CSV lookups"],
        summary: "I interned at Lockheed Martin’s Solar & Astrophysics Laboratory in the summer of 2025, building multithreaded computer vision that tracks sunspots and active regions through gigabytes of solar instrument data to help predict flares. I reconstructed magnetic flux from the polarity inversion lines where flares start, joined separately tracked active-region datasets into one, and ran the processing across more than 100 servers. Along the way I wrote a CSV reader that cut lookups in 1.8 GB files from about a minute to 0.07 seconds.",
        links: [
            { label: "Side project: solar rotation model", href: "https://github.com/borisnezlobin/fast-solar-rotrate" },
            { label: "Thread on X", href: "https://x.com/b_nezlobin/status/1973213855754092749" },
        ],
    },
    {
        id: "robotics",
        title: "Robotics",
        visual: { kind: "figure", figure: "heron" },
        highlights: [{ text: "3x World Championship qualifier", won: true }, "Top 10 autonomous score worldwide", { text: "FIRST Updates Now Top 25", won: true }],
        summary: "I led software for Kuriosity Robotics, top 12 at the 2023 FTC World Championship, where I helped implement Model Predictive Control, autonomous routines, and computer vision. I went on to captain Heron Robotics, where I wrote the multithreaded robot framework and co-wrote Heron Scout, a scouting app used 2,000 times on six continents. Our robot was good enough that World Championship teams copied it.",
        links: [
            { label: "Source on GitHub", href: "https://github.com/HeronRobotics/heron" },
            { label: "Heron Scout", href: "https://heronscout.me" },
        ],
    },
    {
        id: "amelia",
        title: "Amelia",
        visual: { kind: "figure", figure: "amelia" },
        highlights: [{ text: "1st place at MongoDB .local Build Fest", won: true }],
        summary: "Amelia keeps a record of who said what in a group conversation, so deaf and hard-of-hearing people can follow fast talk and ask about it later. It recognizes each voice, learns names from context, and answers questions by quoting what was said.",
        links: [
            { label: "Source on GitHub", href: "https://github.com/borisnezlobin/mongo-hacks" },
            { label: "Hackathon gallery", href: "https://cerebralvalley.ai/e/persistent-context-sprint-hackathon/hackathon/gallery/73" },
        ],
    },
    {
        id: "vantage",
        title: "Vantage",
        visual: { kind: "figure", figure: "vantage" },
        highlights: ["NSF I-Corps", "Berkeley SkyDeck DeCal"],
        summary: "I co-founded Vantage, an operating system for spatial computing where app windows stay pinned to places in the room. I built the prototype on Linux with an iPhone tracking the room, and built its headset driver, window compositor, and optical gesture recognition.",
        links: [],
    },
    {
        id: "enf",
        title: "Grid frequency data",
        visual: { kind: "figure", figure: "enf" },
        highlights: ["Featured by Hack Club"],
        summary: "The power grid’s frequency leaves a faint hum in recordings, so a second-by-second log of it can tell you when a recording was made. In 2024 I reverse-engineered a German provider’s live feed and built the only up-to-date public record of the European grid’s frequency, losing fewer than ten seconds of data a day. It ran for about a month, until the provider reached out and asked very nicely for me to stop.",
        links: [
            { label: "Read the writeup", href: "/writing/enf-data" },
            { label: "Source on GitHub", href: "https://github.com/borisnezlobin/enf" },
        ],
    },
    {
        id: "arbor",
        title: "Arbor",
        visual: { kind: "figure", figure: "arbor" },
        highlights: [{ text: "$2,000 at the Nozomio Hackathon", won: true }],
        summary: "Arbor splits a large task among specialized AI agents and auctions off each piece, paying the winner the runner-up’s price so no agent gains by padding its bid. In the judges’ demo it did the task better than Claude Opus 4.6 and for less money.",
        links: [{ label: "Try Arbor", href: "https://tryarbor.vercel.app" }],
    },
    {
        id: "clients",
        title: "Client sites",
        visual: { kind: "clients" },
        highlights: ["10,000+ monthly users"],
        summary: "I do the branding and design for The Journal For Youth Voice, Palo Alto Stanford Aquatics, and G Studio Productions, and I build and run their websites. I cut their hosting and platform bills by more than 95%, and the CMS I wrote for JYV made publishing three times faster.",
        links: [
            { label: "thejyv.com", href: "https://thejyv.com" },
            { label: "pasa-rinconada.org", href: "https://pasa-rinconada.org" },
            { label: "g.studio", href: "https://g.studio" },
        ],
    },
];
