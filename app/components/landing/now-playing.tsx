"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
        <div className="w-full flex flex-col items-center mt-8 space-y-4 print:items-start print:m-0 print:space-y-2">
            <div className="flex flex-row items-center gap-4">
                <img
                    src={song.albumImageUrl}
                    alt={`${song.album} album cover`}
                    className="w-12 h-12 rounded-md shadow-md"
                />
                <div className="flex flex-col items-start">
                    <Link
                        className="font-semibold link hover:underline"
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
            <p className="text-center text-sm text-muted dark:text-muted-dark print:text-left">
                Currently listening to... this, I guess.<br />Blame&nbsp;
                    <a
                        href="https://x.com/Rand0mLetterz/status/1975673716098122135"
                        target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-primary dark:text-primary-dark"
                    >
                        Spotify&apos;s “Smart” Shuffle
                    </a>
                    &nbsp;if you don&apos;t approve.
            </p>
        </div>
    );
}