import type { ProjectClaim } from "./types";

const SYSTEMS: ProjectClaim = {
    id: "systems",
    verb: "I write",
    noun: "systems software",
    entries: [
        {
            id: "lockheed",
            name: "Lockheed Martin",
            tagline: "Made Lockheed Martin's file reads 980x faster. Developed the most accurate tracking of solar rotation.",
            body: "In the summer of 2025 I interned at Lockheed Martin’s Solar & Astrophysics Laboratory. I built computer vision that runs on thousands of cores and predicts solar flares from gigabytes of instrument data. My multithreaded code tracked sunspots and the active regions around them, which are the patches of strong magnetic field where flares start. Inside a region, flares start along polarity inversion lines (the boundaries where its north and south magnetic fields meet). To predict them, I reconstructed the magnetic flux along those lines. I also merged separately tracked active-region datasets into one. Along the way I wrote a CSV reader that cut lookups in 1.8 GB files from about a minute to 0.07 seconds.",
            links: [
                { label: "Solar rotation model", href: "https://github.com/borisnezlobin/fast-solar-rotrate" },
                { label: "Thread on X", href: "https://x.com/b_nezlobin/status/1973213855754092749" },
            ],
        },
        {
            id: "robotics",
            name: "FTC Robotics",
            tagline: "Top 12 team worldwide. Built tools for 50 teams on 6 continents.",
            won: true,
            body: "I led software for Kuriosity Robotics, which placed in the top 12 at the 2023 FIRST Tech Challenge (FTC) World Championship. I helped write its autonomous routines, its computer vision and its model predictive control, which steers the robot by simulating where each choice of motor power would take it and picking the best one. After that I joined Heron Robotics and became captain of its 13-person team. I wrote its multithreaded robot framework and co-wrote Heron Scout, an app teams on six continents have used 2,000 times to scout other teams. I qualified for Worlds three times. Our robot was good enough that World Championship teams copied it!",
            links: [
                { label: "Source", href: "https://github.com/HeronRobotics/heron" },
                { label: "Heron Scout", href: "https://heronscout.me" },
            ],
        },
        // {
        //     id: "rendr",
        //     name: "rendr",
        //     tagline: "A 3D rasterizer and raytracer in C",
        //     href: "https://github.com/borisnezlobin/rendering",
        //     body: "rendr is a 3D rasterizer and raytracer I wrote in C.",
        // },
        {
            id: "shadowfinder",
            name: "Bellingcat ShadowFinder",
            tagline: "Made Bellingcat's geolocation tool three times faster",
            href: "https://github.com/bellingcat/ShadowFinder/pull/21",
            body: "Bellingcat’s ShadowFinder works out where a photo was taken from the length of a shadow in it. I made it three times faster.",
        },
    ],
};

const PRODUCTS: ProjectClaim = {
    id: "products",
    verb: "I build",
    noun: "cool things",
    entries: [
        {
            id: "enf",
            name: "Grid frequency data",
            tagline: "Made the first public dataset of Europe’s grid frequency",
            href: "/writing/enf-data",
            body: "The European power grid runs at about 50 Hz, but the exact frequency drifts a little every second. That drift leaves a faint hum in audio and video recordings. Matched against a second-by-second log, the hum can tell you whether a recording is real and when it was made. In 2024 I reverse-engineered a German company’s live frequency feed and built the only up-to-date public log of it. It lost fewer than ten seconds of data a day. Hack Club featured it! It ran for about a month before the company asked me (very nicely) to stop.",
            links: [{ label: "Source", href: "https://github.com/borisnezlobin/enf" }],
        },
        {
            id: "clients",
            name: "Client websites",
            tagline: "Three websites with 10,000+ monthly users",
            body: "I build and run the websites for The Journal For Youth Voice (JYV), Palo Alto Stanford Aquatics and G Studio Productions. Together they have more than 10,000 users a month. I cut their hosting and platform bills by more than 95%. JYV’s editors now publish three times faster with the content management system I wrote for them.",
            links: [
                { label: "thejyv.com", href: "https://thejyv.com" },
                { label: "pasa-rinconada.org", href: "https://pasa-rinconada.org" },
                { label: "g.studio", href: "https://g.studio" },
            ],
        },
        {
            id: "yt-downloader",
            name: "YouTube Video Downloader",
            tagline: "A Firefox add-on with 3,721 daily users",
            href: "https://addons.mozilla.org/en-US/firefox/addon/yt-video-downloader/",
            body: "I wrote a Firefox add-on for downloading YouTube videos. It has 3,721 daily users.",
        },
        // {
        //     id: "siyi",
        //     name: "Siyi",
        //     tagline: "A personal CRM for the web and iPhone",
        //     href: "https://www.siyi.app",
        //     body: "Siyi is a personal CRM for the web and iPhone.",
        // },
        {
            id: "semse",
            name: "Semse",
            tagline: "Search that understands your conversations",
            href: "https://github.com/borisnezlobin/semse",
            body: "I built a system that understands your messages and email at a relationship and conversation level, so you can ask questions that traditional search can't answer like, \"What events are my friends going to this month?\"",
        },
        // {
        //     id: "pdf-export-plus",
        //     name: "PDF Export Plus",
        //     tagline: "Obsidian PDFs with real footnotes",
        //     href: "https://github.com/borisnezlobin/obsidian-pdf-export-plus",
        //     body: "PDF Export Plus is an Obsidian plugin that exports PDFs with real page-bottom footnotes.",
        // },
        {
            id: "inca-trail",
            name: "Inca Trail steps",
            tagline: "I'm the first person to count the steps on the Inca Trail",
            href: "/inca",
            body: "I counted all 9,862 steps of the Inca Trail by hand.",
        },
        // {
        //     id: "oneship",
        //     name: "Paly OneShip",
        //     tagline: "An all-in-one app for Palo Alto High School",
        //     href: "https://github.com/borisnezlobin/oneship",
        //     body: "OneShip is an all-in-one app for Palo Alto High School.",
        // },
        {
            id: "maras",
            name: "maras",
            tagline: "On-chain marketplace for vanity-address salts",
            href: "https://github.com/borisnezlobin/maras",
            body: "A salt is a number that decides the address a smart contract gets. People want addresses that start with zero bytes, because each zero byte in an address costs less gas (the fee for running a transaction) to send. Finding a salt whose address starts with five zero bytes takes about 2⁴⁰ hashes, but checking it takes two. maras is a marketplace on the blockchain where miners sell those salts. Because its contract deploys a salt only once the buyer pays, a seller can list one openly and can’t sell it twice.",
        },
        {
            id: "typehero",
            name: "TypeHero",
            tagline: "Algorithmic profanity filter on all community posts",
            href: "https://github.com/typehero/typehero",
            body: "I contributed to TypeHero, an open-source platform for learning TypeScript.",
        },
    ],
};

const COMPETITIONS: ProjectClaim = {
    id: "competitions",
    verb: "I win",
    noun: "competitions",
    entries: [
        {
            id: "amelia",
            name: "Amelia",
            tagline: "Helping deaf people keep up with fast-paced conversations.",
            won: true,
            body: "Amelia keeps a record of who said what in a group conversation. First place at MongoDB .local Build Fest, winning over $15,000 worth of prizes. Deaf and hard-of-hearing people can read it to keep up when the talk moves fast. It tells voices apart and picks up people’s names from what they say.",
            links: [
                { label: "Source", href: "https://github.com/borisnezlobin/mongo-hacks" },
                { label: "Hackathon gallery", href: "https://cerebralvalley.ai/e/persistent-context-sprint-hackathon/hackathon/gallery/73" },
            ],
        },
        {
            id: "thepayments",
            name: "The Payments",
            won: true,
            tagline: "Made coffee cups cheaper for customers and more profitable for sellers",
            href: "https://github.com/borisnezlobin/thepayments",
            body: "The Payments leverages x402 and AUSD to cut out Stripe, Visa, and Mastercard network fees. This allows payments made by agents to be nearly 10% cheaper and still make coffee shops more money per transaction. We made it as easy as possible for sellers to come on chain: it's free, requires pasting just one link, and getting funds into their bank account is one button click.",
        },
        {
            id: "arbor",
            name: "Arbor",
            tagline: "$2,000 at the Nozomio Hackathon",
            href: "https://tryarbor.vercel.app",
            won: true,
            body: "Arbor splits a large task among specialized AI agents and auctions off each piece. In the judges’ demo it did the task better than Claude Opus 4.6 for less money. It won $2,000 at the Nozomio Hackathon.",
        },
        {
            id: "standard-physics",
            name: "Standard Physics",
            tagline: "Check a physical space against all ADA standards from a single iPhone scan",
            href: "https://www.linkedin.com/feed/update/urn:li:activity:7505484140780281856/",
            won: true,
            body: "Standard Physics finds the places where a building breaks accessibility law from an iPhone scan of it. It won $4,000 at a hackathon.",
        },
        {
            id: "alignminder",
            name: "AlignMinder",
            tagline: "Congressional App Challenge honorable mention",
            href: "https://github.com/borisnezlobin/alignminder",
            won: true,
            body: "AlignMinder searches Congressional records faster than the official Congress API does. It ranks them with TF-IDF, which scores a word higher the more times it shows up in one record and the rarer it is across all of them. Politicians can use it to find policymakers and other people who share their views.",
        },
        {
            id: "ezquiz",
            name: "EZQuiz",
            tagline: "Best Presentation at GunnHaX",
            href: "https://github.com/borisnezlobin/EZQuiz",
            won: true,
            body: "EZQuiz is a free-response quiz game for classrooms.",
        },
    ],
};

export const PROJECT_CLAIMS: ProjectClaim[] = [SYSTEMS, PRODUCTS, COMPETITIONS];
