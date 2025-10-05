'use client';

import { useCallback, useEffect, useState } from "react";

const TEXT_SIZE = '1.5rem';

// const nonAlphabeticChars = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i))
//         .filter((char) => !/[a-zA-Z]/.test(char));

// const randomCharacter = () => {
//     return nonAlphabeticChars[Math.floor(Math.random() * nonAlphabeticChars.length)];
// };

const Background = ({
    words,
    trapezoidHeight = 0.5,
    trapezoidBaseLength = 0.4,
    lineSlopeWeight = 0.6,
    charsBetweenWords = 4,
}: {
    words: string[],
    trapezoidHeight?: number,
    trapezoidBaseLength?: number,
    lineSlopeWeight?: number,
    charsBetweenWords?: number
}) => {
    const WORDS = words;
    const TRAPEZOID_HEIGHT = trapezoidHeight;
    const TRAPEZOID_BASE_LENGTH = trapezoidBaseLength;
    const LINE_SLOPE_WEIGHT = lineSlopeWeight;
    const INVERT_SPACE = true;
    const CHARS_BETWEEN_WORDS = charsBetweenWords;
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
    }, [WORDS.length]);

    const randomCharacter = () => {
        // const letters = 'abcdefghijklmnopqrstuvwxyz';
        const letters = ' - · +  ';
        return letters[Math.floor(Math.random() * letters.length)];
    };

    const fillString = useCallback((length: number) => {
        let result = '';
        let wdidx = Math.floor(Math.random() * WORDS.length);
        let prevWdidx = -1;

        let pad = Math.floor(Math.random() * 4) + 1;
        if (length > 4) {
            for (let i = 0; i < pad; i++) {
                result += randomCharacter();
            }
        }

        for (let i = pad; i < length; i++) {
            if (i + WORDS[wdidx].length >= length) {
                for (let j = i; j < length; j++) {
                    result += randomCharacter();
                }
                break;
            } else {
                while (wdidx === prevWdidx) {
                    wdidx = Math.floor(Math.random() * WORDS.length);
                }

                result += WORDS[wdidx];
                prevWdidx = wdidx;

                const numRandomChars = Math.min(Math.floor(Math.random() * CHARS_BETWEEN_WORDS) + 1, length - i - WORDS[wdidx].length);
                for (let j = 0; j < numRandomChars; j++) {
                    result += randomCharacter();
                }
                i += WORDS[wdidx].length + numRandomChars - 1; // i forgor why the -1 is there lmao
                wdidx += Math.floor(Math.random() * 4) - 1 + WORDS.length;
                wdidx %= WORDS.length;
            }
        }
        return result;
    }, [WORDS, CHARS_BETWEEN_WORDS]);

    const charsPerLine = Math.floor(screenSize.width / charSize.width) + 1;
    const linesPerScreen = Math.floor(screenSize.height / charSize.height) - 2;

    useEffect(() => {
        if (charSize.width === 0 || charSize.height === 0) return;
        // const linesPerScreen = Math.floor(screenSize.height / charSize.height);
        const tempLines: string[] = [];

        const numLines = linesPerScreen * TRAPEZOID_HEIGHT;
        const emptyLines = Math.floor((linesPerScreen - numLines) / 2);
        
        if (INVERT_SPACE) {
            for (let i = 0; i < emptyLines; i++) {
                tempLines.push(fillString(charsPerLine));
            }
        }

        for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
            let line = '';
            let wdidx = lineIndex % WORDS.length;
            // const numChars = (numLines / 2 - Math.abs(lineIndex - numLines / 2)) / numLines * charsPerLine + charsPerLine * 0.1;
            const numCharsInMiddle = (charsPerLine * TRAPEZOID_BASE_LENGTH)
                            + ((numLines / 2 - Math.abs(lineIndex - numLines / 2)) / numLines * charsPerLine) * LINE_SLOPE_WEIGHT;
            
            if (INVERT_SPACE) {
                const chars = Math.floor((charsPerLine - numCharsInMiddle) / 2);
                line = fillString(chars) + ' '.repeat(numCharsInMiddle) + fillString(chars);
            } else {
                const spaces = Math.floor((charsPerLine - numCharsInMiddle) / 2);
                line = ' '.repeat(spaces) + fillString(numCharsInMiddle) + ' '.repeat(spaces);
            }
            tempLines.push(line);
        }

        if (INVERT_SPACE) {
            for (let i = 0; i < emptyLines - 1; i++) {
                tempLines.push(fillString(charsPerLine));
            }
            tempLines.push(fillString(charsPerLine * 3 / 8) + ' '.repeat(charsPerLine / 4) + fillString(charsPerLine * 3 / 8));
            tempLines.push(fillString(charsPerLine / 4) + ' '.repeat(charsPerLine / 2) + fillString(charsPerLine / 4));
        }

        setLines(tempLines);
    }, [screenSize, charSize, charsPerLine, linesPerScreen, WORDS, fillString, TRAPEZOID_HEIGHT, INVERT_SPACE, TRAPEZOID_BASE_LENGTH, LINE_SLOPE_WEIGHT]);


    const htmlLines = lines.map((line, index) => {
        const regex = new RegExp(`(${WORDS.join("|")})`, "g");
        const tokens = line.split(regex).filter(Boolean);
        return (
            <pre
                key={index}
                style={{ fontFamily: 'Courier New, monospace', fontSize: TEXT_SIZE }}
                className={`w-full ${INVERT_SPACE ? 'justify-start' : 'justify-center'} items-center m-0 p-0 text-center leading-none !text-[#C5C5C5] dark:!text-[#3C3C3C]`}
            >
                {tokens.map((word, i) => {
                    const active = word === WORDS[wordIndex];
                    const color = active ? (word === 'redhead' ? "text-primary dark:text-primary-dark" : "text-black dark:text-dark-foreground") : "!text-[#C5C5C5] dark:!text-[#3C3C3C]";
                    return (
                        <span
                            key={i}
                            className={`${color} ${active ? "" : ""} !transition-colors !duration-1000 emph`}
                        >
                            {word}
                        </span>
                    );
                })}
            </pre>
        );
    });

    return (
        <div className='absolute w-full h-[100svh] top-0 left-0 text-slate-200 dark:text-slate-800 print:hidden flex flex-col justify-center items-center pointer-events-none select-none z-0'>
            {htmlLines.map((e) => e)}
        </div>
    );
};

export default Background;