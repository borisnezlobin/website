"use client";

import { DiceFiveIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";


const quotes = [
    {
        text: "We dream of a brand new start, but we dream in the dark for the most part.",
        source: "Aaron Burr, Hamilton",
    },
    {
        text: "I'll write my way out... write everything down far as I can see.",
        source: "Alexander Hamilton, Hamilton",
    },
    {
        text: "I love deadlines. I love the whooshing sound they make as they go by.",
        source: "Douglas Adams, The Salmon Of Doubt",
    },
    {
        text: "You never have to change anything you got up in the middle of the night to write.",
        source: "Saul Bellow",
    },
    {
        text: "Writing is just a socially acceptable form of schizophrenia.",
        source: "E.L. Doctrow",
    },
    {
        text: "Write me off and I'd love to read it.",
        source: "Wake Up, Imagine Dragons",
    },
    {
        text: "Ordinary life is pretty complex stuff.",
        source: "Harvey Pekar",
    },
    {
        text: "This little manuever is gonna cost us 51 years.",
        source: "Me, deleting my database",
    },
    {
        text: "Outliers are those who have been given opportunities.",
        source: "Malcolm Gladwell, Outliers",
    },
    {
        text: "It's harder to give away fish than it is to catch them.",
        source: "The Winter of Our Discontent"
    },
    {
        text: "Strength and success — they are above morality, above criticism. It seems, then, that it is not what you do, but how you do it and what you call it... The only punishment is for failure.",
        source: "The Winter of Our Discontent"
    },
    {
        text: "And confidence is a stain they can't wipe off.",
        source: "Drop the World, Lil Wayne"
    },
    {
        text: "I'm not a businessman; I'm a business, man.",
        source: "Jay-Z"
    },
    {
        text: "You can’t concentrate on doing anything if you are thinking, “What’s gonna happen if it doesn’t go right?”",
        source: "Malcolm Gladwell, David and Goliath"
    },
    {
        text: "Because the act of facing overwhelming odds produces greatness and beauty.",
        source: "Malcolm Gladwell, David and Goliath"
    },
    {
        text: "'Til all my sleeves are stained red from all the truth that I've said.",
        source: "Secrets, One Republic"
    },
    {
        text: "There's no mountain I can't climb, no tower too high, no plane I can't learn how to fly.",
        source: "My Dad's Gone Crazy, Eminem"
    },
    {
        text: "I'm going to hell. Who's coming with me?",
        source: "My Dad's Gone Crazy, Eminem"
    }, {
        text: "I'm going to Wichita.",
        source: "Seven Nation Army, The White Stripes"
    }, {
        text: "All the words are gonna bleed from me and I will sing no more.",
        source: "Seven Nation Army, The White Stripes"
    }, {
        text: "The issue with quotes, though, is attribution inaccuracy.",
        source: "John F. Kennedy"
    }, {
        text: "Em dashes (—) are not indicative of AI usage; many human writers know the option+shift+hyphen shortcut.",
        source: "Me"
    }
];


const RandomQuote: React.FC = () => {
    const getRandomIndex = () => Math.floor(Math.random() * quotes.length);
    const random = getRandomIndex();
    const [index, setIndex] = useState(random);

    return (
        <>
            <center className="w-full print:hidden bg-dark-background dark:bg-light-background flex items-center justify-center relative p-2 md:py-8 mb-2 md:px-8 md:pb-12 h-48">
                <p
                    className="text-dark dark:text-light relative w-full font-semibold leading-tight text-center max-w-3xl overflow-hidden text-ellipsis"
                    style={{
                        fontSize: "clamp(0.5rem, 5vw, 1.5rem)",
                        lineHeight: "1.2",
                        overflowWrap: "break-word",
                        wordWrap: "break-word",
                        wordBreak: "break-word",
                    }}
                >
                    {quotes[index].text}
                </p>
                <p className="text-muted-dark dark:text-muted pl-2 whitespace-nowrap emph absolute bottom-0 left-0 w-full text-center py-2 overflow-hidden text-ellipsis">
                    {quotes[index].source}
                </p>
            </center>
            <div className="w-full flex items-center justify-center mb-6">
                <p
                    onClick={() => setIndex(getRandomIndex)}
                    className="group link mt-4 cursor-pointer font-semibold justify-center"
                >
                    <DiceFiveIcon className="group-hover:rotate-[35deg] transition-transform duration-300 text-xl group-active:scale-125" />
                    <span className="">
                        Get another quote
                    </span>
                </p>
            </div>
        </>
    );
};

export default RandomQuote;