"use client"

import { useEffect, useState } from "react";

interface LoadingEffectProps {
    loading: boolean;
    text: string;
    className?: string;
    expectedLength: "short" | "medium" | "long" | "article";
};

const getRandomChar = () => {
    const chars = "               abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 ";
    return chars[Math.floor(Math.random() * chars.length)];
}

const getRandomStr = (length: number) => {
    let str = "";
    for(let i = 0; i < length; i++){
        str += getRandomChar();
    }
    return str;
}

const lengths = {
    short: 10,
    medium: 20,
    long: 40,
    article: 10000,
};

const LoadingEffect = ({ loading, text, expectedLength = "medium", className = "" }: LoadingEffectProps) => {
    const [textToRender, setTextToRender] = useState<string>(getRandomStr(lengths[expectedLength]));

    useEffect(() => {
        if(!loading){
            setTextToRender(text);
        }else {
            setTextToRender(getRandomStr(lengths[expectedLength]));

            const interval = setInterval(() => {
                setTextToRender(getRandomStr(lengths[expectedLength]));
            }, 10);

            return () => clearInterval(interval);
        }
    }, [loading]);

    return (
        <span className={className} suppressHydrationWarning>
            {textToRender}
        </span>
    )
}

export default LoadingEffect;