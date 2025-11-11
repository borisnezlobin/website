"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export const NowPlaying = () => {
    const [song, setSong] = useState<{
        title: string;
        artist: string;
        album: string;
        albumImageUrl: string;
        songUrl: string;
        isPlaying: boolean;
    } | null>(null);

    useEffect(() => {
        const fetchNowPlaying = async () => {
            try {
                const res = await fetch('/api/spotify');
                const data = await res.json();
                setSong(data);
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
                <Equalizer />
            </div>
        </div>
    );
};

const Equalizer = ({ rows = 12, frameDelay = 150 }: { rows?: number; frameDelay?: number }) => {
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

        const primary = theme === "dark" ? [233, 100, 87] : [204, 42, 38];
        const background = theme === "dark" ? [28, 28, 28] : [245, 245, 245];

        const columns = Math.max(1, Math.floor(width / 80));
        const barWidth = width / (columns * 1.5);
        const gap = barWidth * 0.5;
        const rowHeight = height / (rows * 1.5);
        const rowGap = rowHeight * 0.5;

        let levels = Array.from({ length: columns }, () => rows / 2);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            levels.forEach((level, ci) => {
                for (let ri = 0; ri < level; ri++) {
                    const gradientValue = 0.2 + (0.8 * ri) / rows;
                    const color = `rgb(${Math.floor(
                        background[0] * (1 - gradientValue) + primary[0] * gradientValue
                    )}, ${Math.floor(
                        background[1] * (1 - gradientValue) + primary[1] * gradientValue
                    )}, ${Math.floor(
                        background[2] * (1 - gradientValue) + primary[2] * gradientValue
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