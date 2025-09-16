"use client";

import { CopyIcon, XIcon } from "@phosphor-icons/react";
import React, { useState, useRef, useEffect } from "react";

export default function WritePageComponent() {
    const [prompt, setPrompt] = useState("");
    const [time, setTime] = useState(5);
    const [started, setStarted] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [text, setText] = useState("");
    const [canCopy, setCanCopy] = useState(false);
    const [idleTimeout, setIdleTimeout] = useState<NodeJS.Timeout | null>(null);
    const [timerStarted, setTimerStarted] = useState(false);
    const [idleProgress, setIdleProgress] = useState(0); // 0 to 1
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!started || !timerStarted) return;
        if (remaining <= 0) {
            setCanCopy(true);
            return;
        }
        const timer = setInterval(() => {
            setRemaining((r) => r - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [started, remaining, timerStarted]);

    // Idle detection and progress
    useEffect(() => {
        if (idleTimeout) clearTimeout(idleTimeout);
        if (!started || canCopy || !timerStarted) return;
        let start = Date.now();
        setIdleProgress(0);
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            setIdleProgress(Math.min(elapsed / 5000, 1));
        }, 50);
        const timeout = setTimeout(() => {
            endSession(true);
        }, 5000);
        setIdleTimeout(timeout);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
        // eslint-disable-next-line
    }, [text, started, canCopy, timerStarted]);

    const endSession = (failed: boolean) => {
        setCanCopy(true);
        setRemaining(0);
        setTimerStarted(false);
        setIdleProgress(0);
        if (idleTimeout) clearTimeout(idleTimeout);
        setPrompt("");
        if (failed) {
            setStarted(false);
            setText("");
        }
    }

    // Prevent copy/paste until allowed
    useEffect(() => {
        const handler = (e: ClipboardEvent) => {
            if (!canCopy) e.preventDefault();
        };
        document.addEventListener("copy", handler);
        document.addEventListener("cut", handler);

        // todo: determine whether we need to block paste as well?
        // document.addEventListener("paste", handler);
        return () => {
            document.removeEventListener("copy", handler);
            document.removeEventListener("cut", handler);
            // document.removeEventListener("paste", handler);
        };
    }, [canCopy]);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (time > 0) {
            setStarted(true);
            setRemaining(time * 60);
            setText("");
            setCanCopy(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto min-h-screen mt-4 p-4 flex flex-col gap-6 relative">
            {!started ? (
                <>
                    <h1 className="text-2xl font-bold">Writing, no stopping.</h1>
                    <p>
                        Set a time, give yourself a prompt, and write. No distractions and definitely no stopping. Pause for too long and you&apos;ll lose everything ;)<br /><br />

                        If you want to end early, you&apos;ll need to write at least 75 words. You can keep writing once time is up, but you won&apos;t be able to copy your text until the timer ends.<br /><br />

                        Made for when you just don&apos;t know what to say — college essays, creative writing, journaling, or even just to get your thoughts out. Keep writing until the clock hits stop.
                    </p>
                    <div className="flex flex-col gap-4 min-h-screen">
                        <label className="flex flex-col gap-1">
                            Prompt (optional):
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="border border-muted dark:border-muted-dark rounded p-2 bg-light-background dark:bg-dark-background duration-300 transition-colors"
                                placeholder="Enter a prompt..."
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Time (minutes):
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={time}
                                onChange={e => setTime(Number(e.target.value))}
                                className="border rounded p-2 border-muted dark:border-muted-dark"
                            />
                        </label>
                        <div className="flex flex-row justify-center gap-x-4 items-center">
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(1)}>1 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(5)}>5 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(10)}>10 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(15)}>15 min</button>
                        </div>
                        <button onClick={handleStart} className="bg-primary dark:bg-primary-dark min-w-64 mx-auto text-white rounded px-4 py-2 font-semibold">Start</button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col relative h-full">
                    {/* {prompt && <div className="p-2 bg-gray-100 rounded text-gray-700">Prompt: {prompt}</div>} */}
                    <div className={`font-mono text-lg !text-muted dark:!text-muted-dark ${prompt && "mb-1"} px-2`}>
                        {remaining > 0 && <span>{Math.floor(remaining/60)}:{(remaining%60).toString().padStart(2,"0")} left</span>}
                        <span className="">{remaining === 0 && "Done!"}</span>
                    </div>
                    <p className={`w-full text-lg ${prompt && "px-2 mb-4"} italic`} style={{ lineHeight: 1.8 }}>
                        {prompt}
                    </p>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => {
                            setText(e.target.value);
                            // // Auto-resize
                            // const ta = textareaRef.current;
                            // if (ta) {
                            //     ta.style.height = "auto";
                            //     ta.style.height = ta.scrollHeight + "px";
                            // }
                        }}
                        onKeyDown={e => {
                            if (!canCopy && !timerStarted && started) {
                                setTimerStarted(true);
                            }
                            if (!canCopy && idleTimeout) {
                                clearTimeout(idleTimeout);
                            }
                        }}
                        onKeyUp={() => {
                            if (!canCopy && timerStarted) {
                                if (idleTimeout) clearTimeout(idleTimeout);
                                setIdleProgress(0);
                                const timeout = setTimeout(() => endSession(true), 5000);
                                setIdleTimeout(timeout);
                            }
                        }}
                        style={{
                            opacity: canCopy ? 1 : 1 - idleProgress,
                            transition: "color 0.2s, opacity 0.2s",
                            lineHeight: 2.5,
                            overflow: "hidden"
                        }}
                        className={`h-[calc(100svh-12rem)] outline-none !text-light-foreground dark:!text-dark-foreground !bg-light-background dark:!bg-dark-background transition-all duration-300 w-full min-h-4/5 p-2 resize-none text-xl caret-primary dark:caret-primary-dark ${canCopy ? "bg-green-50" : "bg-white"}`}
                        placeholder={canCopy ? "Time's up! You can copy and paste your writing." : "Start typing..."}
                        spellCheck={true}
                        autoFocus
                    />
                    <div className="fixed bottom-4 left-0 w-full flex justify-center items-center !bg-transparent">
                        <div className={`flex flex-col items-center px-3 pt-3 shadow-lg border border-muted dark:border-muted-dark bg-gray-200 dark:bg-gray-700 rounded-lg w-[400px] max-w-[90%]`}>
                            <div className="flex flex-row items-center justify-between gap-4 w-2/3">
                                <p className="text-left">
                                    {/* show word count */}
                                    {text.split(" ").filter(word => word.length > 0).length} words
                                </p>
                                {/* End or Copy button */}
                                {canCopy ? (
                                    <button
                                        className="flex flex-row items-center gap-2 px-3 py-1 rounded-md bg-primary dark:bg-primary-dark text-white transition"
                                        onClick={() => {
                                            navigator.clipboard.writeText(text);
                                            alert("Text copied to clipboard!");
                                        }}
                                        title="Copy text"
                                    >
                                        <CopyIcon />
                                        Copy
                                    </button>
                                ) : (
                                    text.split(" ").filter(word => word.length > 0).length >= 75 ? (
                                        <button
                                            className="flex flex-row items-center gap-2 px-3 py-1 rounded-md bg-primary dark:bg-primary-dark text-white transition"
                                            onClick={() => endSession(false)}
                                            title="End session early"
                                        >
                                            <XIcon />
                                            End Early
                                        </button>
                                    ) : (
                                        <p className="text-sm text-muted dark:text-muted-dark">
                                            {75 - text.split(" ").filter(word => word.length > 0).length} words left<br />
                                            before you can finish early
                                        </p>
                                    )
                                )}
                            </div>

                            {/* Track */}
                            {canCopy ? (
                                <button
                                    onClick={() => 
                                        endSession(true)
                                    }
                                    className="h-8 hover:text-primary hover:dark:text-primary-dark hover:underline flex flex-row justify-center items-center gap-1 mr-2"
                                >
                                    <XIcon className="text-sm" />
                                    Exit
                                </button>
                            ) : (
                                <div className="flex flex-row justify-center items-center gap-4 w-2/3 h-8">
                                    <div className="flex-1 h-0.5 !bg-muted-dark dark:!bg-muted rounded-full relative">
                                        {/* Slider fill */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-2 !bg-red-600 transition-all !duration-75"
                                            style={{ width: `${idleProgress < 0.05 ? 0 : (idleProgress + 0.05) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
