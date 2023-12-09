"use client"

import { useState } from "react";
import useWindowSize from "../utils/use-window-size";

const DynamicBackground = ({ width, height, boxSize }: { width: number, height: number, boxSize: number }) => {
    const windowSize = useWindowSize();
    const [key, setKey] = useState(Math.random());

    const boxes = [];
    for (let x = 0; x < width; x += boxSize) {
        for (let y = 0; y < height; y += boxSize) {
            boxes.push(<rect key={`${x}-${y}`} x={x} y={y} width={boxSize} height={boxSize} fill={`hsl(${(x / width) * 360}, 100%, 50%)`} />)
        }
    }

    return (
        <svg key={key} width={windowSize.width} height={windowSize.height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
            {boxes}
        </svg>
    )
}

export default DynamicBackground;