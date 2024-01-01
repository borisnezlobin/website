import { useEffect, useState } from "react";

const div = document.createElement("div");
// the div has to be added to the DOM for getBoundingClientRect() to work
// up to you where you want to put it, but this is a simple example that works
// it does make a div with content "a" appear on your page (scroll/display is up to you to fix)
document.body.appendChild(div);

function useCharacterSize(fontName: string, fontSize: string, character: string = "a") {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        div.style.fontFamily = fontName;
        // @ts-ignore
        div.style.fontSize = TEXT_SIZES[fontSize].fontSize;
        // @ts-ignore
        div.style.lineHeight = TEXT_SIZES[fontSize].lineHeight;
        div.style.width = "1ch";
        div.textContent = character;
        // get width of div
        const rect = div.getBoundingClientRect();
        setWidth(rect.width);
        setHeight(rect.height);
    }, [fontName, fontSize]);

    return { width, height };
    // or, return <div>a</div>
}


const TEXT_SIZES = {
    'text-xs': {
        fontSize: '0.75rem',
        lineHeight: '1rem',
    },
    'text-sm': {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
    },
    'text-base': {
        fontSize: '1rem',
        lineHeight: '1.5rem',
    },
    'text-lg': {
        fontSize: '1.125rem',
        lineHeight: '1.75rem',
    },
    'text-xl': {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
    },
    'text-2xl': {
        fontSize: '1.5rem',
        lineHeight: '2rem',
    },
    'text-3xl': {
        fontSize: '1.875rem',
        lineHeight: '2.25rem',
    },
    'text-4xl': {
        fontSize: '2.25rem',
        lineHeight: '2.5rem',
    },
    'text-5xl': {
        fontSize: '3rem',
        lineHeight: '1',
    },
    'text-6xl': {
        fontSize: '3.75rem',
        lineHeight: '1',
    },
    'text-7xl': {
        fontSize: '4.5rem',
        lineHeight: '1',
    },
    'text-8xl': {
        fontSize: '6rem',
        lineHeight: '1',
    },
    'text-9xl': {
        fontSize: '8rem',
        lineHeight: '1',
    },
}

export { useCharacterSize };