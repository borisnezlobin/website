'use client';

import { useEffect, useState } from 'react';

const INT_TO_CHAR = {
    0: '·',
    1: '•',
    2: 'o',
    3: '0',
    4: 'O',
};

const Background = () => {
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [charSize, setCharSize] = useState({ width: 0, height: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
            span.style.fontSize = '16px';
            span.style.position = 'absolute';
            span.style.visibility = 'hidden';
            span.textContent = 'M';
            document.body.appendChild(span);

            const rect = span.getBoundingClientRect();
            setCharSize({
                width: rect.width,
                height: rect.height,
            });

            document.body.removeChild(span);
        };

        const updateMousePosition = (event: MouseEvent) => {
            setMousePosition({
                x: event.clientX,
                y: event.clientY + window.scrollY,
            });
        };

        updateScreenSize();
        calculateCharSize();

        window.addEventListener('resize', updateScreenSize);
        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            window.removeEventListener('resize', updateScreenSize);
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    const rerenderKey = `${screenSize.width}x${screenSize.height}-${charSize.width}x${charSize.height}-${(mousePosition.y > screenSize.height) ? 0 : mousePosition.x}x${Math.min(mousePosition.y, screenSize.height)}`;

    // number of character that fit on a line
    const charsPerLine = Math.floor(screenSize.width / charSize.width) + 1;
    // number of lines that fit on the screen
    const linesPerScreen = Math.floor(screenSize.height / charSize.height);

    // Calculate the character position based on mouse coordinates
    const charX = Math.min(Math.floor(mousePosition.x / charSize.width), charsPerLine - 1);
    const charY = Math.min(Math.floor(mousePosition.y / charSize.height), linesPerScreen - 1);

    return (
        <div>
            {/* write "." characters for each in charsPerLine and linesPerScreen */}
            <pre
                style={{
                    lineHeight: '1em',
                    fontFamily: '"Courier New" !important, monospace !important',
                    fontSize: '16px',
                    margin: 0,
                    position: 'absolute',
                    zIndex: 0,
                    top: 0,
                    left: 0,
                }}
                key={rerenderKey}
            >
                {Array.from({ length: linesPerScreen }).map((_, lineIndex) => (
                    <div key={lineIndex} style={{ height: `${charSize.height}px` }}>
                        {Array.from({ length: charsPerLine }).map((_, charIndex) => {
                            const distance = Math.sqrt(
                                (charIndex - charX) ** 2 +
                                    ((lineIndex - charY) * (charSize.height / charSize.width)) ** 2
                            );
                            const RADIUS_SCALE = 3;
                            let intensity = Math.max(0, 4 - Math.floor(distance / RADIUS_SCALE));
                            // add or subtract 1 to intensity randomly to add some noise
                            const noise =
                                distance > 4 * RADIUS_SCALE
                                    ? 0
                                    : Math.random() < 0.5
                                    ? -1
                                    : 1;
                            intensity = Math.max(0, Math.min(4, intensity + noise));
                            const char = INT_TO_CHAR[intensity as keyof typeof INT_TO_CHAR];
                            return (
                                <span
                                    key={charIndex}
                                    className='emph text-muted-dark dark:text-muted'
                                >
                                    {(charIndex === charX && lineIndex === charY) ? char : char}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </pre>
        </div>
    );
};

export default Background;