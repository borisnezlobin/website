'use client';

import { useEffect, useState } from "react";

const WORDS = ['programmer', 'student', 'designer', 'redhead', 'researcher', 'writer', 'nerd'];
const TEXT_SIZE = '1.5rem';

const Background = () => {
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [charSize, setCharSize] = useState({ width: 0, height: 0 });

    const [wordIndex, setWordIndex] = useState(0);
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const updateScreenSize = () => {
            setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        const calculateCharSize = () => {
            const span = document.createElement('span');
            span.style.fontFamily = 'Courier New, monospace';
            span.style.fontSize = TEXT_SIZE;
            span.style.position = 'absolute';
            span.style.visibility = 'hidden';
            span.textContent = 'M';
            document.body.appendChild(span);

            const rect = span.getBoundingClientRect();
            setCharSize({ width: rect.width, height: rect.height });

            document.body.removeChild(span);
        };

        const updateWordIndex = () => {
            setWordIndex((prevIndex) => (prevIndex + 1) % WORDS.length);
        };

        const wordInterval = setInterval(updateWordIndex, 2000);

        calculateCharSize();
        updateScreenSize();

        window.addEventListener('resize', updateScreenSize);

        return () => {
            clearInterval(wordInterval);
            window.removeEventListener('resize', updateScreenSize);
        };
    }, []);

    const charsPerLine = Math.floor(screenSize.width / charSize.width) + 1;
    const linesPerScreen = Math.floor(screenSize.height / charSize.height) - 2;

    useEffect(() => {
        if (charSize.width === 0 || charSize.height === 0) return;
        // const linesPerScreen = Math.floor(screenSize.height / charSize.height);
        const tempLines: string[] = [];
        const numLines = linesPerScreen / 2;

        for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
            let line = '';
            let wdidx = lineIndex % WORDS.length;
            const numChars = (numLines / 2 - Math.abs(lineIndex - numLines / 2)) / numLines * charsPerLine + charsPerLine * 0.1;
            for (let charIndex = 0; charIndex < numChars; charIndex++) {
                line += WORDS[wdidx] + ' ';
                charIndex += WORDS[wdidx].length; // account for word length (but not the space)
                wdidx += Math.floor(Math.random() * 4) - 1 + WORDS.length;
                wdidx %= WORDS.length;
            }
            tempLines.push(line);
        }
        setLines(tempLines);
    }, [screenSize, charSize, charsPerLine, linesPerScreen]);


    const htmlLines = lines.map((line, index) => {
        const parts = line.split(/\s+/).filter(Boolean);
        return (
            <div
                key={index}
                style={{ fontFamily: 'Courier New, monospace', fontSize: TEXT_SIZE }}
                className="w-full justify-center items-center m-0 p-0 text-center leading-none !text-[#C5C5C5] dark:!text-[#3C3C3C] transition-colors duration-300"
            >
                {parts.map((word, i) => {
                    const active = word === WORDS[wordIndex];
                    return (
                        <span
                            key={i}
                            className={`${
                            active
                                ? "text-primary dark:text-primary-dark"
                                : "!text-[#C5C5C5] dark:!text-[#3C3C3C]"
                            } transition-colors duration-300 emph`}
                        >
                            {word + " "}
                        </span>
                    );
                })}
            </div>
        );
    });

    return (
        <div className='absolute w-full h-[100svh] top-0 left-0 text-slate-200 dark:text-slate-800 print:hidden flex flex-col justify-center items-center pointer-events-none select-none z-0'>
            {htmlLines.map((e) => e)}
        </div>
    );
};

export default Background;