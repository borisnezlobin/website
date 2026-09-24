import type { PlateContent } from "./types";

export const PLATES: PlateContent[] = [
    {
        id: "lockheed",
        title: "Lockheed Martin",
        visual: { kind: "figure", figure: "sun" },
        highlights: ["Solar flare prediction", "980x faster CSV lookups"],
        summary: [
            "I interned at Lockheed Martin’s Solar & Astrophysics Laboratory, building computer vision that predicts solar flares from gigabytes of instrument data, coordinating the work across thousands of cores.",
            "Over the summer of 2025 I tracked sunspots and active regions through that data with multithreaded code, reconstructed magnetic flux from the polarity inversion lines where flares start, and joined separately tracked active-region datasets into one.",
            "Along the way I wrote a CSV reader that cut lookups in 1.8 GB files from about a minute to 0.07 seconds.",
        ],
        links: [
            { label: "Side project: solar rotation model", href: "https://github.com/borisnezlobin/fast-solar-rotrate" },
            { label: "Thread on X", href: "https://x.com/b_nezlobin/status/1973213855754092749" },
        ],
    },
    {
        id: "robotics",
        title: "Robotics",
        visual: { kind: "figure", figure: "heron" },
        highlights: [{ text: "3x Worlds qualifier", won: true }, "Top 10 autonomous worldwide", { text: "FIRST Updates Now Top 25", won: true }],
        summary: [
            "I led software for Kuriosity Robotics, top 12 at the 2023 FTC World Championship, and went on to captain Heron Robotics, a 13-person team of my own.",
            "At Kuriosity I helped implement Model Predictive Control, autonomous routines, and computer vision.",
            "At Heron I wrote the multithreaded robot framework and co-wrote Heron Scout, a scouting app used 2,000 times on six continents.",
            "Our robot was good enough that World Championship teams copied it.",
        ],
        links: [
            { label: "Source on GitHub", href: "https://github.com/HeronRobotics/heron" },
            { label: "Heron Scout", href: "https://heronscout.me" },
        ],
    },
    {
        id: "amelia",
        title: "Amelia",
        visual: { kind: "figure", figure: "amelia" },
        highlights: [{ text: "1st place, MongoDB .local Build Fest", won: true }],
        summary: [
            "I won the first-place grand prize, about $13.5k in cash and credits, at MongoDB .local Build Fest for Amelia, which keeps a record of who said what in a group conversation so deaf and hard-of-hearing people can follow fast talk and ask about it later.",
            "It recognizes each voice, learns names from context, and answers questions by quoting what was said.",
        ],
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
        summary: [
            "I co-founded Vantage, an operating system for spatial computing where app windows stay pinned to places in the room.",
            "I built the prototype on Linux with an iPhone tracking the room, and built its headset driver, window compositor, and optical gesture recognition.",
        ],
        links: [],
    },
    {
        id: "enf",
        title: "Grid frequency data",
        visual: { kind: "figure", figure: "enf" },
        highlights: ["Featured by Hack Club"],
        summary: [
            "In 2024 I reverse-engineered a German provider’s live feed to build the only up-to-date public record of the European grid’s frequency, losing fewer than ten seconds of data a day.",
            "The grid’s frequency leaves a faint hum in recordings, so a second-by-second log of it can tell you whether a recording or video is real, and the exact time it was recorded at.",
            "My record ran for about a month, until the provider reached out and asked very nicely for me to stop.",
        ],
        links: [
            { label: "Read the writeup", href: "/writing/enf-data" },
            { label: "Source on GitHub", href: "https://github.com/borisnezlobin/enf" },
        ],
    },
    {
        id: "arbor",
        title: "Arbor",
        visual: { kind: "figure", figure: "arbor" },
        highlights: [{ text: "$2,000 at Nozomio Hackathon", won: true }],
        summary: [
            "I won $2,000 at the Nozomio Hackathon for Arbor, which splits a large task among specialized AI agents and auctions off each piece.",
            "Each winner is paid the runner-up’s price, so no agent gains by padding its bid.",
            "In the judges’ demo Arbor did the task better than Claude Opus 4.6 and for less money.",
        ],
        links: [{ label: "Try Arbor", href: "https://tryarbor.vercel.app" }],
    },
    {
        id: "clients",
        title: "Client sites",
        visual: { kind: "clients" },
        highlights: ["10,000+ monthly users"],
        summary: [
            "I design, build, and run the websites for three organizations with more than 10,000 monthly users, and I cut their hosting and platform bills by more than 95%.",
            "I do the branding and design for The Journal For Youth Voice, Palo Alto Stanford Aquatics, and G Studio Productions.",
            "The CMS I wrote for JYV made publishing three times faster.",
        ],
        links: [
            { label: "thejyv.com", href: "https://thejyv.com" },
            { label: "pasa-rinconada.org", href: "https://pasa-rinconada.org" },
            { label: "g.studio", href: "https://g.studio" },
        ],
    },
];
