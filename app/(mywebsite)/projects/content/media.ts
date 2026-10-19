/** Photos and short muted loops for each project, served from /project-media (not /projects, which redirects). */
export type ProjectMedia = {
    kind: "image" | "video";
    /** The full-size image, or the mp4 for a video. */
    src: string;
    /** A small webp: the thumbnail of an image, or the first frame of a video. */
    preview: string;
    alt: string;
    width: number;
    height: number;
};

const ROOT = "/project-media";

const image = (path: string, alt: string, width: number, height: number): ProjectMedia => ({
    kind: "image",
    src: `${ROOT}/${path}.webp`,
    preview: `${ROOT}/${path}-thumb.webp`,
    alt,
    width,
    height,
});

const video = (path: string, alt: string, width: number, height: number): ProjectMedia => ({
    kind: "video",
    src: `${ROOT}/${path}.mp4`,
    preview: `${ROOT}/${path}-poster.webp`,
    alt,
    width,
    height,
});

export const PROJECT_MEDIA: Record<string, ProjectMedia[]> = {
    robotics: [
        image("robotics/robot-explodes-label", "Two hands pointing at a warning sticker on the robot that says it may explode", 1600, 1200),
        video("robotics/garage-field-vertical", "The robot on the garage field, filmed from behind the wall", 720, 1280),
        video("robotics/robot-scores-garage", "The robot driving up to the red goal in the garage", 360, 480),
        image("robotics/robot-at-red-goal-competition", "The robot parked in front of the red goal at a competition", 1200, 1600),
        video("robotics/competition-stream", "Drivers lining up their robot for qualification match 65", 432, 600),
        video("robotics/garage-field-run", "The robot driving across the garage practice field", 1280, 720),
        image("robotics/robot-27621-hero", "Robot 27621 on the practice field, with its orange side plates and the arm folded over the top", 1600, 1200),
        video("robotics/intake-from-above", "The robot seen from directly above as it drives", 720, 1280),
        image("robotics/two-robots-workshop", "Two robots side by side on the workshop floor", 1600, 1200),
        video("robotics/blue-field-run", "A practice run on a field with a blue goal, with balls scattered across the floor", 1280, 720),
        image("robotics/robot-front-red-goal", "The robot facing the camera in front of the red goal", 1200, 1600),
        image("robotics/pit-from-above", "The pit from above, with the robot surrounded by parts and tools", 1200, 1600),
        video("robotics/robot-close-run", "The robot driving on the practice field", 1280, 720),
        image("robotics/garage-practice-field", "The practice field built in a garage, with a goal at each end", 1600, 1200),
        image("robotics/robot-workbench", "The robot on the practice field in front of the workbench", 1200, 1600),
    ],
    lockheed: [
        image("lockheed/lockheed-sign", "The Lockheed Martin sign outside the office", 1600, 1200),
        image("lockheed/lockheed-desk", "A desk at Lockheed Martin, with a satellite model on the cabinet", 1600, 1200),
    ],
    shadowfinder: [
        image(
            "shadowfinder/shadowfinder-possible-locations",
            "A ShadowFinder world map with a glowing ring around every place a 10-unit object casts an 8-unit shadow at noon UTC on 29 February 2024",
            950,
            437,
        ),
    ],
    enf: [
        video("enf/enf-frequency-loop", "The grid frequency trace scrolling as new readings arrive, with the live value in the corner", 1280, 548),
        image("enf/enf-frequency-trace", "The European grid frequency wandering around 50 Hz, with the stretches above 50 Hz shaded red and a full day's trace along the bottom", 1600, 686),
    ],
    clients: [
        image("clients/jyv-homepage", "The Journal For Youth Voice homepage with its lead article, three more headlines, and a row of recent pieces", 1600, 1000),
        image("clients/pasa-homepage", "The PASA Rinconada homepage with a swimmer mid-stroke above buttons to find a program or schedule a tryout", 1600, 1000),
        image("clients/gstudio-homepage", "The G Studio homepage, where the logo sits on video stills cut into angular polygon tiles", 1600, 1000),
    ],
    semse: [
        image("semse/semse-loneliness-answer", "Semse answering what Brendan said in a conversation about loneliness, with the iMessage thread it found the answer in below", 1600, 1314),
        image("semse/semse-who-did-i-meet", "Semse answering who I met recently by naming the people from a recent group chat", 1498, 340),
    ],
    "inca-trail": [
        image("inca-trail/counting-6699", "The tally notebook held over a long flight of stone steps climbing into the cloud forest", 1200, 1600),
        image("inca-trail/counting-6717", "The open tally notebook over a wide mountain valley near the end of the trail", 1600, 1200),
        video("inca-trail/counting-in-the-rain", "Walking and counting steps in the rain, hood up", 608, 1080),
        image("inca-trail/counting-6630", "A page of step tallies held up against jagged peaks", 1200, 1600),
        image("inca-trail/counting-6709", "Two notebook pages packed with step tallies, with a pen resting on them", 1200, 1600),
        image("inca-trail/counting-6603", "The notebook and a boot at an overlook above the Urubamba river", 1600, 1200),
        image("inca-trail/counting-6689", "A selfie in the rain near the high pass, with the notebook in hand", 1600, 1200),
    ],
    maras: [
        image("maras/maras-landing", "The Maras homepage, with a search box for contract addresses next to a cluster of pink cubes", 1600, 914),
        image("maras/maras-market", "The Maras marketplace, with contract addresses for sale at 0.0001 ETH each and filters for Uniswap hook permissions", 1600, 914),
        image("maras/maras-request-address", "The form for requesting an address, where a buyer picks how many leading zero bytes they want and posts a bounty in ETH", 1600, 914),
    ],
    typehero: [
        image(
            "typehero/profanity-challenge-card",
            "TypeHero's challenge creation form with swear words in the title and description, both flagged in red: the name and the description must not contain bad words",
            1600,
            852,
        ),
        image("typehero/profanity-settings-bio", "TypeHero settings with a swear word in the bio and a link to hell.com, each rejected with \"Don't use profanity.\"", 1600, 1320),
    ],
    amelia: [
        image("amelia/amelia-hackathon-demo", "Showing Amelia to another hacker, with the app transcribing the conversation on screen", 1600, 901),
        image("amelia/team-mongodb-wall", "The team in front of MongoDB's \"Build anything. Change everything.\" wall", 1600, 1200),
        image("amelia/switch-lite-prize", "A Nintendo Switch Lite won as a prize, still in its box", 1200, 1600),
        image("amelia/hackathon-champion-trophy", "The glass MongoDB Hackathon Champion trophy from .local Build Fest SF", 1200, 1600),
    ],
    thepayments: [
        video("thepayments/bars-cheaper-and-more", "Bar chart of a $6 drink: a card payment loses 46¢ to fees, while an agent pays $5.72 and the shop keeps 18¢ more", 1280, 800),
        video("thepayments/one-link-storefront", "A shop owner pastes Mind Coffee's menu link, clicks Build my storefront, and gets a storefront listing all 63 items", 1280, 800),
        image("thepayments/text-your-agent", "Two texts with an AI agent: a request for a drink under $5 from Ladle & Leaf, and the agent's reply with a $3.15 cart to pay in AUSD", 1600, 1000),
        video("thepayments/orders-arrive", "Ladle & Leaf's dashboard jumping from $0.00 to $3.15 ready to withdraw, then showing Alex's new order paid in AUSD", 1280, 800),
        image("thepayments/bab-hacks-stage", "The team on stage at B@B Hacks under a screen naming The Payments as a $750 track winner", 1200, 1400),
    ],
    arbor: [
        video("arbor/arbor-auction-loop", "One auction round: sealed bids grow, the runner-up's price appears, and the winning agent is picked", 1280, 548),
        image("arbor/arbor-auction-round", "Six AI agents' bids as columns, with the winner rising past the dashed line at the runner-up's price", 1600, 686),
    ],
    "standard-physics": [
        image("standard-physics/wheelchair-sim-counter", "A simulated wheelchair user reaching for a cup on a counter inside a scanned room", 1080, 850),
        image("standard-physics/team-production-ready-award", "The four-person team holding CoreWeave's Most Production-Ready Award check for a Formula 1 ticket and $1K", 1280, 960),
        video(
            "standard-physics/instagram-reel",
            "The team's reel: walking a Sharetea shop with an iPhone, the 3D rebuild, a counter measured at 42 inches against a 36-inch limit, and the fix loop",
            720,
            1280,
        ),
        video("standard-physics/scanning-a-doorway", "Scanning a doorway with an iPhone", 720, 1280),
        video("standard-physics/wheelchair-sim-approach", "A simulated wheelchair user rolling up to the counter in a scanned room", 1080, 850),
        video(
            "standard-physics/pitch-deck-scan-to-fix",
            "The pitch deck turning a phone scan into a 3D shop, flagging a 47-inch counter against a 36-inch limit, and lowering the card reader to 36 inches",
            1280,
            800,
        ),
        image("standard-physics/report", "The report for a sample boba shop, listing a counter that's too high and a path that's too narrow", 1520, 1450),
        image("standard-physics/team-with-race-car", "The team crouched with the award check in front of a Formula 1 car at CoreWeave's hackathon", 1024, 768),
    ],
    alignminder: [
        image("alignminder/alignminder-home", "The AlignMinder homepage with a search box for bills, politicians, and policy allies", 1600, 1000),
        image("alignminder/alignminder-search", "AlignMinder results for “stricter emissions standards”, listing related bills from Congress", 1600, 1000),
    ],
};
