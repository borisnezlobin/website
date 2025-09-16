
"use client";
import React, { useState, useRef, useEffect } from "react";

export default function WritePage() {
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
        if (!started || canCopy || !timerStarted) return;
        if (idleTimeout) clearTimeout(idleTimeout);
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
        document.addEventListener("paste", handler);
        return () => {
            document.removeEventListener("copy", handler);
            document.removeEventListener("cut", handler);
            document.removeEventListener("paste", handler);
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
        <div className="max-w-4xl mx-auto min-h-screen mt-12 p-4 flex flex-col gap-6 relative">
            {!started ? (
                <>
                    <h1 className="text-2xl font-bold">All you have to do is write.</h1>
                    <form onSubmit={handleStart} className="flex flex-col gap-4 min-h-screen">
                        <label className="flex flex-col gap-1">
                            Prompt (optional):
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="border rounded p-2 bg-light-background dark:bg-dark-background"
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
                                className="border rounded p-2"
                            />
                        </label>
                        <div className="flex flex-row justify-center gap-x-4 items-center">
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(1)}>1 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(5)}>5 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(10)}>10 min</button>
                            <button type="button" className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded cursor-pointer" onClick={() => setTime(15)}>15 min</button>
                        </div>
                        <button type="submit" className="bg-primary min-w-64 mx-auto text-white rounded px-4 py-2 font-semibold">Start</button>
                    </form>
                </>
            ) : (
                <div className="flex flex-col relative h-full">
                    {/* {prompt && <div className="p-2 bg-gray-100 rounded text-gray-700">Prompt: {prompt}</div>} */}
                    <div className="font-mono text-lg !text-muted dark:!text-muted-dark mb-1 px-2">
                        Time left: {Math.floor(remaining/60)}:{(remaining%60).toString().padStart(2,"0")}
                    </div>
                    <p className="w-full text-xl px-2 mb-4">
                        {prompt}
                    </p>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => {
                            if (!timerStarted && started) {
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
                        disabled={canCopy}
                        style={{
                            color: canCopy
                                ? "#166534"
                                : `rgb(${Math.round(220 + 35 * idleProgress)},${Math.round(220 - 220 * idleProgress)},${Math.round(220 - 220 * idleProgress)})`,
                            opacity: canCopy ? 1 : 1 - 0.6 * idleProgress,
                            transition: "color 0.2s, opacity 0.2s"
                        }}
                        className={`outline-none !text-light-foreground dark:!text-dark-foreground !bg-light-background dark:!bg-dark-background transition-all duration-300 w-full min-h-4/5 p-2 resize-none text-xl caret-primary dark:caret-primary-dark ${canCopy ? "bg-green-50" : "bg-white"}`}
                        placeholder={canCopy ? "Time's up! You can copy and paste your writing." : "Start typing..."}
                        spellCheck={true}
                        autoFocus
                    />
                    <div className="fixed w-full bottom-2 left-0">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-4">
                            {!canCopy && <div className="text-red-500 text-sm">If you stop typing for more than 5 seconds, everything will be deleted.</div>}
                            {canCopy && <div className="text-green-600 font-semibold">Time&apos;s up! You can now copy and paste your writing.</div>}
                            <div
                                className={`h-2 bg-red-500 rounded-full transition-all duration-100`}
                                style={{ width: `${idleProgress * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
