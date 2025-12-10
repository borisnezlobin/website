"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
// @ts-expect-error types missing lol
import pixels from "image-pixels";

const HISTOGRAM_SCALE = 25;

function keyToRGB(key: string) {
    const [r, g, b] = key.split(',');

    return [(parseInt(r) * HISTOGRAM_SCALE), (parseInt(g) * HISTOGRAM_SCALE), (parseInt(b) * HISTOGRAM_SCALE)];
}

export const NowPlaying = () => {
    const [song, setSong] = useState<{
        title: string;
        artist: string;
        album: string;
        albumImageUrl: string;
        songUrl: string;
        isPlaying: boolean;
    } | null>(null);
    const [dominantColor, setDominantColor] = useState<number[] | null>(null);
    const [secondaryColor, setSecondaryColor] = useState<number[] | null>(null);

    useEffect(() => {
        const fetchNowPlaying = async () => {
            try {
                const res = await fetch('/api/spotify');
                const data = await res.json();
                setSong(data);

                if (data && data.albumImageUrl) {
                    const imgData = await pixels(data.albumImageUrl);
                    const imgPixels = imgData.data;
                    console.log("Image Pixels:", imgPixels);
                    console.log("width", imgData.width, "height", imgData.height);
                    const histogram: { [key: string]: number } = {};

                    const downsampleFactor = 10;
                    for (let i = 0; i < imgPixels.length; i += 4 * downsampleFactor) {
                        let r = imgPixels[i];
                        let g = imgPixels[i + 1];
                        let b = imgPixels[i + 2];

                        if (r < 40 && g < 40 && b < 40) continue;
                        if (r > 220 && g > 220 && b > 220) continue;

                        // "move" the color away from the dark/light extremes
                        const shift = 60;
                        r = Math.min(255, Math.max(0, r + (r < 128 ? shift : -shift)));
                        g = Math.min(255, Math.max(0, g + (g < 128 ? shift : -shift)));
                        b = Math.min(255, Math.max(0, b + (b < 128 ? shift : -shift)));

                        const key = Math.floor(r / HISTOGRAM_SCALE) + "," + Math.floor(g / HISTOGRAM_SCALE) + "," + Math.floor(b / HISTOGRAM_SCALE);
                        if (histogram[key]) {
                            histogram[key] += 1;
                        } else {
                            histogram[key] = 1;
                        }
                    }

                    const sortedColors = Object.keys(histogram).sort((a, b) => histogram[b] - histogram[a]);
                    const dominant = keyToRGB(sortedColors[0]);
                    setDominantColor(dominant);

                    let distances = sortedColors.slice(1).map(colorKey => {
                        const [r1, g1, b1] = dominant;
                        const [r2, g2, b2] = keyToRGB(colorKey);
                        return {
                            key: colorKey,
                            distance: Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))
                        };
                    });

                    // distances.sort((a, b) => b.distance - a.distance);
                    // distance is at most HISTOGRAM_SCALE ^ 3; however, histogram frequency is at most  width * height / downsampleFactor
                    const maxFrequency = (imgData.width * imgData.height) / downsampleFactor;
                    const maxDistance = Math.sqrt(Math.pow(255 / HISTOGRAM_SCALE, 3));
                    distances = distances.filter(a => histogram[a.key] > 300).filter(a => a.distance > 50); // album covers are 640x640
                    
                    distances.sort((a, b) => {
                        const distanceWeight = 0.5;
                        const scoreA = (histogram[a.key] / maxFrequency) + (a.distance / maxDistance) * distanceWeight;
                        const scoreB = (histogram[b.key] / maxFrequency) + (b.distance / maxDistance) * distanceWeight;

                        console.log(`Color ${a.key}: frequency ${histogram[a.key]}, distance ${a.distance}, score ${scoreA}`);
                        console.log(`Color ${b.key}: frequency ${histogram[b.key]}, distance ${b.distance}, score ${scoreB}`);
                        return scoreB - scoreA;
                    });
                    const sortedByDistance = distances.map(d => d.key);

                    if (distances.length === 0) {
                        setSecondaryColor(dominant);
                        return;
                    }
                    const secondary = keyToRGB(sortedByDistance[0]);
                    setSecondaryColor(secondary);
                }
            } catch (error) {
                console.error("Error fetching now playing:", error);
            }
        };

        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 1 * 1000 * 60);
        return () => clearInterval(interval);
    }, []);

    if (!song || !song.isPlaying) {
        return null;
    }

    return (
        <div className="print:hidden relative w-full flex flex-col h-[20rem] items-center justify-end mb-3 mt-8 space-y-4 z-20 print:items-start print:m-0 print:space-y-2">
            <div className="h-full flex items-end justify-center pb-4">
                <div className="flex w-96 flex-row items-center rounded-md bg-light-background/70 dark:bg-dark-background/70 backdrop-blur-md border border-muted-dark/40 dark:border-muted/40 shadow-lg">
                    <img
                        src={song.albumImageUrl}
                        alt={`${song.album} album cover`}
                        className="w-1/4 rounded-l-md shadow-md"
                    />
                    <div className="px-2 pl-4 py-4 w-3/4 min-w-0 flex flex-col items-start">
                        <Link
                            className="font-semibold link hover:underline w-full !block overflow-hidden text-ellipsis whitespace-nowrap"
                            href={song.songUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {song.title}
                        </Link>
                        <span className="text-sm text-muted dark:text-muted-dark">
                            {song.artist}
                        </span>
                    </div>
                </div>
            </div>
            <div className="w-full absolute h-[20rem] overflow-hidden left-0 bottom-0 flex justify-center z-[-1]">
                <div
                    className="w-1/2 h-1/2 blur-3xl absolute scale-y-50 top-1/2 -translate-x-8 -translate-y-4 opacity-60 animate-float animate-pulse"
                    style={{ backgroundColor: `rgb(${dominantColor ? dominantColor.join(',') : '204,42,38'})` }}
                />
                <div
                    className="w-1/3 h-1/2 blur-3xl absolute top-1/2 scale-y-50 translate-x-8 translate-y-16 opacity-40 animate-float-reverse animate-pulse"
                    style={{ backgroundColor: `rgb(${secondaryColor ? secondaryColor.join(',') : '204,42,38'})` }}
                />
                <div
                    className="w-1/3 h-1/2 blur-3xl absolute scale-y-50 top-1/2 translate-x-12 translate-y-4 opacity-60 animate-float animate-pulse"
                    style={{ backgroundColor: `rgb(${dominantColor ? dominantColor.join(',') : '204,42,38'})` }}
                />
                <div
                    className="w-1/3 h-1/2 blur-3xl absolute top-1/2 scale-y-50 -translate-x-8 -translate-y-6 opacity-40 animate-float-reverse animate-pulse"
                    style={{ backgroundColor: `rgb(${secondaryColor ? secondaryColor.join(',') : '204,42,38'})` }}
                />
                <Equalizer primary={dominantColor} />
            </div>
            <div className="w-full absolute bottom-[-2rem] flex justify-center z-[-1]">
                <p>
                    Listening to this right now!
                </p>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(-10px) translateX(10px);
                    }
                }

                @keyframes float-reverse {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(10px) translateX(-10px);
                    }
                }

                .animate-float {
                    animation: float 5s ease-in-out infinite;
                }

                .animate-float-reverse {
                    animation: float-reverse 5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

const Equalizer = ({ rows = 12, frameDelay = 150, primary, background }: { rows?: number; frameDelay?: number, primary?: number[] | null, background?: number[] | null }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;

        const handleResize = () => {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener("resize", handleResize);

        const columns = Math.max(1, Math.floor(width / 80));
        const barWidth = width / (columns * 1.5);
        const gap = barWidth * 0.5;
        const rowHeight = height / (rows * 1.5);
        const rowGap = rowHeight * 0.5;

        let levels = Array.from({ length: columns }, () => rows / 2);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            let backColor = background;
            let frontColor = primary ?? (theme === "dark" ? [233, 100, 87] : [204, 42, 38]);

            if (theme === "light") {
                frontColor = boostSaturation(frontColor, 0.3);
            }
            if (!backColor) {
                backColor = (theme === "dark") ? [28, 28, 28] : [245, 245, 245];
            }
            levels.forEach((level, ci) => {
                for (let ri = 0; ri < level; ri++) {
                    const gradientValue = 0.2 + (0.8 * ri) / rows;
                    const color = `rgb(${Math.floor(
                        backColor[0] * (1 - gradientValue) + frontColor[0] * gradientValue
                    )}, ${Math.floor(
                        backColor[1] * (1 - gradientValue) + frontColor[1] * gradientValue
                    )}, ${Math.floor(
                        backColor[2] * (1 - gradientValue) + frontColor[2] * gradientValue
                    )})`;
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        ci * (barWidth + gap),
                        height - (ri + 1) * (rowHeight + rowGap) + rowGap,
                        barWidth,
                        rowHeight
                    );
                }
            });
        };

        const update = () => {
            const mid = Math.floor(columns / 2);
            levels = levels.map((level, index) => {
                const rand = (Math.random() - 0.5) * 4;
                const next = level + Math.sign(rand) * Math.floor(Math.abs(rand));
                let rangeMin = rows / 2;
                if (index < mid) {
                    const scale = 1 - (mid - index) / mid;
                    rangeMin = (rows / 2) * scale;
                } else {
                    const scale = 1 - (index - mid) / mid;
                    rangeMin = (rows / 2) * scale;
                }
                return Math.max(rangeMin, Math.min(rangeMin + rows / 2, next));
            });
        };

        let lastTime = 0;
        const render = (time: number) => {
            const delta = time - lastTime;
            if (delta >= frameDelay) {
                update();
                draw();
                lastTime = time;
            }
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, [rows, theme, frameDelay]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

// skibidi chatgpt saturdation-boosting code below
const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

// r,g,b: 0–255 → [h, s, l] with s,l in 0–1
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r: h = ((g - b) / d) % 6; break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
        if (h < 0) h += 360;
    }
    return [h, s, l];
};

// h: 0–360, s,l: 0–1 → [r,g,b] 0–255
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};

const boostSaturation = (rgb: number[], amount = 0.25): number[] => {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const boostedS = clamp(s + amount, 0, 1);
    return hslToRgb(h, boostedS, l);
};