"use client";

import { useEffect, useState } from "react";

const PRECISION = Math.pow(10, 5);

const Age = () => {
    var isClient = window !== undefined;


    const timeSince =
        (Date.now() - new Date(2008, 8, 20, 2).valueOf()) /
        (1_000 * 60 * 60 * 24 * 365);
    const msStart = Date.now();
    const [msSince, setMsSince] = useState(0);

    useEffect(() => {
        if (isClient) {
            const interval = setInterval(() => {
                setMsSince(Date.now() - msStart);
            }, 40);

            return () => clearInterval(interval);
        }
    }, [msStart]);

    const age = (timeSince + 0.000000000031689 * msSince).toFixed(15);
    return (
        <>
            <span className="text-primary dark:text-primary-dark emph">
                {age.split(".")[0]}
            </span>
            <span className="emph">.{age.split(".")[1]}</span>
        </>
    );
};

export { Age };
