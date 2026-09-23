"use client";

import { useEffect, useState } from "react";
import { MUTED_TEXT } from "./tones";

const MINUTE_MS = 60_000;
const BERKELEY_CLOCK = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
});

export function LocalTime() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let timer = 0;
        const tick = () => {
            const current = new Date();
            setNow(current);
            timer = window.setTimeout(tick, MINUTE_MS - (current.getTime() % MINUTE_MS) + 50);
        };
        tick();
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <p className={`min-h-6 text-sm ${MUTED_TEXT}`}>
            {now && <>It’s <time dateTime={now.toISOString()}>{BERKELEY_CLOCK.format(now)}</time> in Berkeley.</>}
        </p>
    );
}
