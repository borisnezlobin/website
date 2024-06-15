"use client"
import { useEffect, useState } from "react";

const Age = () => {
    // not my real birthday (off by a bit)
    const timeSince = (((Date.now() - (new Date(2008, 8, 20, 2)).valueOf()) / (1_000 * 60 * 60 * 24 * 365)));
    const msStart = Date.now();
    const [msSince, setMsSince] = useState(0);

    useEffect(() => {
        setInterval(() => {
            setMsSince(Date.now() - msStart);
        }, 10)
    }, []);

    return <>
        {timeSince + (0.000000000031689 * msSince)}
    </>
}

export { Age };