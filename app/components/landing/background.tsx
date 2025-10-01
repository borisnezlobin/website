'use client';

import { useEffect, useState } from 'react';

const INT_TO_CHAR = {
    0: '·',
    1: '•',
    2: 'o',
    3: '0',
    4: 'O',
};

const TRAIL_LENGTH = 4;
const RADIUS_SCALE = 3;

const Background = () => {
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [charSize, setCharSize] = useState({ width: 0, height: 0 });
    const [trail, setTrail] = useState<{ x: number; y: number; t: number }[]>([]);

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
            setCharSize({ width: rect.width, height: rect.height });

            document.body.removeChild(span);
        };

        const updateMousePosition = (() => {
            let lastCall = 0;
            return (event: MouseEvent) => {
                const now = Date.now();
                if (now - lastCall < 30) return;
                lastCall = now;
                const pos = {
                    x: event.clientX,
                    y: event.clientY + window.scrollY,
                    t: Date.now(),
                };
                setTrail(prev => {
                    const updated = [...prev, pos].slice(-TRAIL_LENGTH);
                    return updated;
                });
            };
        })();

        updateScreenSize();
        calculateCharSize();

        window.addEventListener('resize', updateScreenSize);
        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            window.removeEventListener('resize', updateScreenSize);
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    const charsPerLine = Math.floor(screenSize.width / charSize.width) + 1;
    const linesPerScreen = Math.floor(screenSize.height / charSize.height);
    const pos = trail.length > 0 ? trail[0] : { x: 0, y: 0, t: 0 };
    const charX = Math.min(Math.floor(pos.x / charSize.width), charsPerLine - 1);
    const charY = Math.min(Math.floor(pos.y / charSize.height), linesPerScreen - 1);

    return (
        <div>
            <pre
                style={{
                    lineHeight: '1em',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '16px',
                    margin: 0,
                    position: 'absolute',
                    zIndex: 0,
                    top: 0,
                    left: 0,
                }}
            >
                {Array.from({ length: linesPerScreen }).map((_, lineIndex) => (
                    <div key={lineIndex} style={{ height: `${charSize.height}px` }}>
                        {Array.from({ length: charsPerLine }).map((_, charIndex) => {
                            const distance = Math.sqrt(
                                (charIndex - charX) ** 2 +
                                    ((lineIndex - charY) * (charSize.height / charSize.width)) ** 2
                            );

                            let intensity = Math.max(0, 4 - Math.floor(distance / RADIUS_SCALE));
                            // add or subtract 1 to intensity randomly to add some noise
                            const noise =
                                distance > 4 * RADIUS_SCALE
                                    ? 0
                                    : Math.random() < 0.5
                                    ? -1
                                    : 1;
                            // const noise = 0;
                            intensity = Math.max(0, Math.min(4, intensity + noise));
                            let char = '·';

                             if (distance < 4 * RADIUS_SCALE) {
                                if (4 * RADIUS_SCALE < distance + 0.5) {
                                    const slope = (lineIndex - charY) / ((charIndex - charX) || 1) * (charSize.height / charSize.width);

                                    // find character perpendicular to the slope
                                    if (Math.abs(slope) < 0.3) {
                                        char = "|";
                                    } else if (Math.abs(slope) < 0.6) {
                                        char = slope > 0 ? "\\" : "/";
                                    } else if (Math.abs(slope) < 1.5) {
                                        char = slope > 0 ? "/" : "\\";
                                    } else {
                                        char = "—";
                                    }
                                } else {
                                    if (charX === charIndex && lineIndex === charY) {
                                        char = '@';
                                    } else {
                                        char = INT_TO_CHAR[intensity as keyof typeof INT_TO_CHAR];
                                    }
                                }
                            } else {
                                // check if current grid cell is near any trail point
                                for (let i = trail.length - 1; i >= 0; i--) {
                                    const p = trail[i];
                                    const charX = Math.floor(p.x / charSize.width);
                                    const charY = Math.floor(p.y / charSize.height);

                                    if (charIndex === charX && lineIndex === charY) {
                                        const age = (trail.length - i - 1) / trail.length * 4;
                                        char = age === 0 ? '@' : INT_TO_CHAR[Math.max(0, 4 - age) as keyof typeof INT_TO_CHAR];
                                        break;
                                    }
                                }
                            }

                            return (
                                <span
                                    key={charIndex}
                                    className={`emph text-muted-dark dark:text-muted ${char === '@' ? 'text-primary dark:text-primary' : ''} ${(Math.random() < 0.5 && distance < 2 * RADIUS_SCALE) ? 'text-primary dark:text-primary' : ''}`}
                                >
                                    {char}
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