"use client";

import { useIsVisible } from "@/app/utils/use-is-visible";
import { useEffect, useRef, useState } from "react";

const BIRTH = new Date(2008, 8, 20, 2);

const birthdayIn = (year: number) =>
    new Date(year, BIRTH.getMonth(), BIRTH.getDate(), BIRTH.getHours()).valueOf();

const yearsSinceBirth = (now: number) => {
    const currentYear = new Date(now).getFullYear();
    const lastBirthdayYear =
        birthdayIn(currentYear) <= now ? currentYear : currentYear - 1;
    const lastBirthday = birthdayIn(lastBirthdayYear);
    const nextBirthday = birthdayIn(lastBirthdayYear + 1);
    const wholeYears = lastBirthdayYear - BIRTH.getFullYear();
    return wholeYears + (now - lastBirthday) / (nextBirthday - lastBirthday);
};

const Age = () => {
    var isClient = window !== undefined;
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIsVisible(ref, { trackWindowFocus: true });
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        if (isClient && isVisible) {
            const interval = setInterval(() => {
                setNow(Date.now());
            }, 40);

            return () => clearInterval(interval);
        }
    }, [isClient, isVisible]);

    const age = yearsSinceBirth(now).toFixed(15);
    return (
        <>
            <span className="text-primary emph" ref={ref}>
                {age.split(".")[0]}
            </span>
            <span className="emph">.{age.split(".")[1]}</span>
        </>
    );
};

export default Age;
