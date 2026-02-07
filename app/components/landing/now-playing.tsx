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

function brightenIfNecessary(color: number[]): number[] {
    const brightness = (color[0] + color[1] + color[2]) / 3;
    const MIN_BRIGHTNESS = 50;
    if (brightness >= MIN_BRIGHTNESS) {
        return color;
    }
    const increase = MIN_BRIGHTNESS - brightness;
    console.log("Increasing brightness by", increase, "for color", color, "whose brightness is", brightness);
    if (color[0] < 75 && color[1] < 75 && color[2] < 75) {
        return color.map(c => Math.min(255, (c / brightness) * MIN_BRIGHTNESS));
    }

    return color;
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

                if (!data || !data.albumImageUrl) {
                    setSong(null);
                    return;
                }

                // cough cough. not that I would ever...
                if (data.title.includes("Shake That") || data.title.includes("In Paris")) {
                    setSong(null);
                    return;
                }

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
                    const MIN_FREQUENCY_FOR_SECONDARY_COLOR = 409; // pixels
                    distances = distances
                        .filter(a => histogram[a.key] > MIN_FREQUENCY_FOR_SECONDARY_COLOR) // album covers are 640x640 = 409,600 pixels; so this is about 0.1% of pixels
                        .filter(a => a.distance > 50); // ensure secondary color is somewhat different
                    
                    distances.sort((a, b) => {
                        const distanceWeight = 4.5;
                        const scoreA = (histogram[a.key] / maxFrequency) + (a.distance / maxDistance) * distanceWeight;
                        const scoreB = (histogram[b.key] / maxFrequency) + (b.distance / maxDistance) * distanceWeight;

                        return scoreB - scoreA;
                    });
                    const sortedByDistance = distances.map(d => d.key);

                    if (distances.length === 0) {
                        setSecondaryColor(dominant.map(c => c * HISTOGRAM_SCALE));
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

    let adjustedDominant = dominantColor ? [...dominantColor] : [204, 0, 0];
    let adjustedSecondary = secondaryColor ? [...secondaryColor] : [204, 0, 0];
    adjustedDominant = brightenIfNecessary(adjustedDominant);
    adjustedSecondary = brightenIfNecessary(adjustedSecondary);

    const backgroundColor = [28 + (adjustedDominant[0] / 2), 28 + (adjustedDominant[1] / 2), 28 + (adjustedDominant[2] / 2)];
    const textBackgroundColor = [...backgroundColor]
    if ((textBackgroundColor[0] + textBackgroundColor[1] + textBackgroundColor[2]) / 3 > 100) {
        textBackgroundColor[0] = Math.max(0, textBackgroundColor[0] - 50);
        textBackgroundColor[1] = Math.max(0, textBackgroundColor[1] - 50);
        textBackgroundColor[2] = Math.max(0, textBackgroundColor[2] - 50);
    }

    return (
        <div className="relative w-full flex flex-col h-[20rem] items-center justify-end my-20 space-y-4 z-20 print:hidden print:m-0 print:space-y-2">
            <div className="absolute h-[150%] translate-y-1/4 w-screen bg-dark-background -z-10" />
            <div className="h-full flex items-end justify-center pb-4">
                <div
                    className="flex w-96 flex-row items-center rounded-md backdrop-blur-md shadow-lg animate-pulse-border"
                    style={{
                        border: `1px solid rgba(${adjustedSecondary[0] * 1.2}, ${adjustedSecondary[1] * 1.2}, ${adjustedSecondary[2] * 1.2}, 1.0)`,
                        animation: `pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                        backgroundColor: `rgba(${textBackgroundColor[0]}, ${textBackgroundColor[1]}, ${textBackgroundColor[2]}, 0.5)`,
                    }}
                >
                    <img
                        src={song.albumImageUrl}
                        alt={`${song.album} album cover`}
                        className="w-1/4 rounded-l-md shadow-md"
                    />
                    <div className="px-2 pl-4 py-4 w-3/4 min-w-0 flex flex-col items-start">
                        <Link
                            className="font-semibold link hover:underline w-full !block overflow-hidden text-ellipsis whitespace-nowrap !text-dark-foreground"
                            href={song.songUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {song.title}
                        </Link>
                        <span className="text-sm text-muted-dark">
                            {song.artist}
                        </span>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes pulse-border {
                        0% {
                            border-color: rgba(${adjustedSecondary[0] * 1.2}, ${adjustedSecondary[1] * 1.2}, ${adjustedSecondary[2] * 1.2}, 0.5);
                        }
                        50% {
                            border-color: rgba(${adjustedSecondary[0]}, ${adjustedSecondary[1]}, ${adjustedSecondary[2]}, 1.0);
                        }
                        100% {
                            border-color: rgba(${adjustedSecondary[0] * 1.2}, ${adjustedSecondary[1] * 1.2}, ${adjustedSecondary[2] * 1.2}, 0.5);
                        }
                    }
                `}</style>
            </div>
            <div className="w-full absolute h-[20rem] overflow-hidden left-0 bottom-0 flex justify-center z-[-1]">
                <div
                    className="w-2/3 h-2/3 absolute scale-y-50 top-1/2 translate-y-4 opacity-50 blur-2xl animate-pulse"
                    style={{
                        backgroundColor: `rgb(${adjustedDominant.join(',')})`
                    }}
                />
                <div
                    className="w-1/2 h-1/2 absolute top-1/2 scale-y-50 translate-x-8 translate-y-16 scale-75 opacity-30 rounded-full blur-3xl animate-pulse"
                    style={{
                        backgroundColor: `rgb(${adjustedSecondary.join(',')})`
                    }}
                />
                <div
                    className="w-1/3 h-2/3 absolute scale-y-50 top-1/2 -translate-y-14 opacity-50 blur-2xl rounded-full animate-pulse"
                    style={{
                        backgroundColor: `rgb(${adjustedDominant.join(',')})`
                    }}
                />
                <div
                    className="w-1/3 h-1/2 absolute top-1/2 scale-y-50 -translate-x-12 translate-y-0 scale-75 opacity-30 blur-3xl animate-pulse"
                    style={{
                        backgroundColor: `rgb(${adjustedSecondary.join(',')})`
                    }}
                />
                <Equalizer primary={adjustedDominant} />
            </div>
            <div className="w-full absolute bottom-[-3rem] flex justify-center z-[-1]">
                <p className="text-dark-foreground">
                    Listening right now!
                </p>
            </div>
        </div>
    );
};

const Equalizer = ({ rows = 12, frameDelay = 150, primary, background }: { rows?: number; frameDelay?: number, primary?: number[] | null, background?: number[] | null }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            let frontColor = primary ?? [233, 100, 87];

            if (!backColor) {
                backColor = [28, 28, 28];
            }
            levels.forEach((level, ci) => {
                for (let ri = 0; ri < level; ri++) {
                    const gradientValue = 0.05 + (0.8 * ri) / rows;
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
    }, [rows, primary, frameDelay]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};