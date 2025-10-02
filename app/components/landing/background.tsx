'use client';

import { useEffect, useState } from "react";

const WORDS = ['programmer', 'student', 'designer', 'redhead', 'gamer', 'researcher', 'writer', 'nerd'];
const TEXT_SIZE = '3rem';

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

        for (let lineIndex = 0; lineIndex < linesPerScreen; lineIndex++) {
            let line = '';
            let wdidx = lineIndex % WORDS.length;
            for (let charIndex = 0; charIndex < charsPerLine; charIndex++) {
                line += WORDS[wdidx] + ' ';
                charIndex += WORDS[wdidx].length; // account for word length (but not the space)
                wdidx += Math.floor(Math.random() * 4) - 1 + WORDS.length;
                wdidx %= WORDS.length;
            }
            tempLines.push(line);
        }
        setLines(tempLines);
        console.log({ lines: tempLines, charsPerLine, linesPerScreen })
    }, [screenSize, charSize, charsPerLine, linesPerScreen]);


    const htmlLines = lines.map((line, index) => {
        line = line.replace(new RegExp(WORDS[wordIndex], 'g'), `<span class="text-primary dark:text-primary-dark emph !transition-colors !duration-300">${WORDS[wordIndex]}</span>`);
        return line;
    });

    return (
        <div className='absolute w-full h-[100svh] top-0 left-0 text-muted dark:text-muted-dark print:hidden flex-row justify-center items-center pointer-events-none select-none z-0'>
            {htmlLines.map((line, lineIndex) => (
                <div key={lineIndex} style={{ height: charSize.height }} className="w-full flex justify-center">
                    <pre
                        className="m-0 p-0 leading-none text-muted-dark dark:text-muted !transition-colors !duration-300"
                        style={{ fontFamily: 'Courier New, monospace', fontSize: TEXT_SIZE, lineHeight: TEXT_SIZE }}
                        dangerouslySetInnerHTML={{ __html: line }}
                    />
                </div>
            ))}
        </div>
    );
};

export default Background;