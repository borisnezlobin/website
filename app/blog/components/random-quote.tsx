"use client";

import { DiceFive } from "@phosphor-icons/react/dist/ssr";
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
        text: "Don't stop; be Lee, Ving. Hold on to that fee, Ling.",
        source: "Anon",
    },
    {
        text: "The road to hell is paved with adverbs.",
        source: "Stephen King",
    },
    {
        text: "Writing is just a socially acceptable form of schizophrenia.",
        source: "E.L. Doctrow",
    },
    {
        text: "pls hire me pls bro I swear bro I will NOT delete your database this time",
        source: "Me, applying to jobs",
    },
    {
        text: "There are three rules for writing a novel. Unfortunately, no one knows what they are.",
        source: "W. Somerset Maughan",
    },
    {
        text: "Write me off and I'd love to read it.",
        source: "LOOM, Imagine Dragons",
    },
    {
        text: "Here is a lesson in creative writing. First rule: Do not use semicolons. They are transvestite hermaphrodites representing absolutely nothing. All they do is show you've been to college.",
        source: "Kurt Vonnegut, A Man Without a Country",
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
        text: "Outliers are those who have been given opportunities",
        source: "Malcolm Gladwell, Outliers",
    }
];


const RandomQuote: React.FC = () => {
    const getRandomIndex = () => Math.floor(Math.random() * quotes.length);
    const [index, setIndex] = useState(getRandomIndex());
    
    return (
        <center className="w-full my-12 md:mb-24 print:hidden">
            <p>
                <span className="text-2xl font-bold mr-3">
                    &ldquo;
                </span>
                {quotes[index].text}
                <span className="text-2xl font-bold ml-2">
                    &rdquo;
                </span>
            </p>
            <p className="text-muted dark:text-muted-dark">
                — {quotes[index].source}
            </p>
            <p onClick={() => setIndex(getRandomIndex)} className="group link mt-4 cursor-pointer font-semibold justify-center">
                <DiceFive className="group-hover:rotate-[35deg] transition-transform duration-300 text-xl group-active:scale-125" />
                <span>
                    Get another quote
                </span>
            </p>
        </center>
    )
};

export default RandomQuote;