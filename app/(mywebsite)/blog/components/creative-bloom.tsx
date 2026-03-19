"use client";

import React from "react";

// Durations in seconds
const A = 0.5;   // appear draw duration per element
const D = 0.22;  // disappear draw duration per element

type PathSpec = {
    d: string;
    /** delay when appearing (bloom outward from center) */
    a: number;
    /** delay when disappearing (collapse inward from outside) */
    d_: number;
    sw?: number;
};

type DotSpec = {
    cx: number; cy: number; r: number;
    a: number; d_: number;
};

function pathStyle(spec: PathSpec, visible: boolean): React.CSSProperties {
    const dur = visible ? A : D;
    const delay = visible ? spec.a : spec.d_;
    return {
        strokeDasharray: 1,
        strokeDashoffset: visible ? 0 : 1,
        opacity: visible ? 1 : 0,
        strokeWidth: spec.sw ?? 0.85,
        transition: [
            `stroke-dashoffset ${dur}s ${visible ? "ease-out" : "ease-in"} ${delay}s`,
            `opacity ${dur * 0.55}s ease-out ${delay}s`,
        ].join(", "),
    } as React.CSSProperties;
}

function dotStyle(spec: DotSpec, visible: boolean): React.CSSProperties {
    const dur = visible ? A : D;
    const delay = visible ? spec.a : spec.d_;
    return {
        opacity: visible ? 1 : 0,
        transition: `opacity ${dur * 0.5}s ease-out ${delay}s`,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry (viewBox 0 0 600 110, center cx=300 cy=55)
// Bloom order: center → inner diamond → outer diamond → arcs → petals →
//              lines → pips → ticks (near→far) → end brackets
// Collapse reverses: brackets → ticks (far→near) → pips → lines → …→ center
// ─────────────────────────────────────────────────────────────────────────────

const PATHS: PathSpec[] = [
    // ── INNER DIAMOND ──
    { d: "M300,45 L311,55 L300,65 L289,55 Z",           a: 0.04, d_: 0.22, sw: 0.75 },

    // ── OUTER DIAMOND ──
    { d: "M300,34 L321,55 L300,76 L279,55 Z",           a: 0.09, d_: 0.19, sw: 0.9  },

    // ── VERTICAL CONNECTORS (outer diamond top/bottom → arc peaks) ──
    { d: "M300,34 L300,10",                              a: 0.13, d_: 0.17 },
    { d: "M300,76 L300,100",                             a: 0.13, d_: 0.17 },

    // ── EYE/LENS ARCS — split at peak so they draw outward from center ──
    // top-left arm
    { d: "M300,10 C 268,10 254,27 254,55",              a: 0.17, d_: 0.14, sw: 0.8 },
    // top-right arm
    { d: "M300,10 C 332,10 346,27 346,55",              a: 0.17, d_: 0.14, sw: 0.8 },
    // bottom-left arm
    { d: "M300,100 C 268,100 254,83 254,55",            a: 0.17, d_: 0.14, sw: 0.8 },
    // bottom-right arm
    { d: "M300,100 C 332,100 346,83 346,55",            a: 0.17, d_: 0.14, sw: 0.8 },

    // ── SWEEPING PETAL ARMS (from outer diamond vertices, diagonal) ──
    { d: "M300,34 C 282,20 264,14 256,9",               a: 0.22, d_: 0.13, sw: 0.75 },
    { d: "M300,34 C 318,20 336,14 344,9",               a: 0.22, d_: 0.13, sw: 0.75 },
    { d: "M300,76 C 282,90 264,96 256,101",             a: 0.22, d_: 0.13, sw: 0.75 },
    { d: "M300,76 C 318,90 336,96 344,101",             a: 0.22, d_: 0.13, sw: 0.75 },

    // ── PETAL TIP TICKS ──
    { d: "M252,9 L260,9",                               a: 0.27, d_: 0.12, sw: 0.7 },
    { d: "M340,9 L348,9",                               a: 0.27, d_: 0.12, sw: 0.7 },
    { d: "M252,101 L260,101",                           a: 0.27, d_: 0.12, sw: 0.7 },
    { d: "M340,101 L348,101",                           a: 0.27, d_: 0.12, sw: 0.7 },

    // ── HORIZONTAL LINES (from eye points outward) ──
    { d: "M254,55 L55,55",                              a: 0.22, d_: 0.11 },
    { d: "M346,55 L545,55",                             a: 0.22, d_: 0.11 },

    // ── DIAMOND PIPS on lines ──
    { d: "M174,49 L181,55 L174,61 L167,55 Z",          a: 0.32, d_: 0.09, sw: 0.75 },
    { d: "M426,49 L433,55 L426,61 L419,55 Z",          a: 0.32, d_: 0.09, sw: 0.75 },

    // ── TICK MARKS — pairs radiating outward ──
    // inner (near eye)
    { d: "M248,49 L248,61",                             a: 0.28, d_: 0.10, sw: 0.7 },
    { d: "M352,49 L352,61",                             a: 0.28, d_: 0.10, sw: 0.7 },
    // medium
    { d: "M220,51 L220,59",                             a: 0.32, d_: 0.08, sw: 0.65 },
    { d: "M380,51 L380,59",                             a: 0.32, d_: 0.08, sw: 0.65 },
    // outer
    { d: "M148,49 L148,61",                             a: 0.37, d_: 0.06, sw: 0.7 },
    { d: "M452,49 L452,61",                             a: 0.37, d_: 0.06, sw: 0.7 },
    // far
    { d: "M118,51 L118,59",                             a: 0.40, d_: 0.04, sw: 0.65 },
    { d: "M482,51 L482,59",                             a: 0.40, d_: 0.04, sw: 0.65 },

    // ── CURVED END BRACKETS ──
    // left: straight extension + two curved arms
    { d: "M55,55 L38,55  M55,55 C 43,55 32,44 23,41  M55,55 C 43,55 32,66 23,69",   a: 0.45, d_: 0.02 },
    // right: mirror
    { d: "M545,55 L562,55  M545,55 C 557,55 568,44 577,41  M545,55 C 557,55 568,66 577,69", a: 0.45, d_: 0.02 },
];

const DOTS: DotSpec[] = [
    // center
    { cx: 300, cy: 55,  r: 2.5, a: 0,    d_: 0.25 },
    // arc peaks
    { cx: 300, cy: 10,  r: 1.5, a: 0.13, d_: 0.16 },
    { cx: 300, cy: 100, r: 1.5, a: 0.13, d_: 0.16 },
    // diamond pips
    { cx: 174, cy: 55,  r: 1.3, a: 0.33, d_: 0.08 },
    { cx: 426, cy: 55,  r: 1.3, a: 0.33, d_: 0.08 },
    // end bracket curl tips
    { cx: 23,  cy: 41,  r: 1.2, a: 0.52, d_: 0    },
    { cx: 23,  cy: 69,  r: 1.2, a: 0.52, d_: 0    },
    { cx: 577, cy: 41,  r: 1.2, a: 0.52, d_: 0    },
    { cx: 577, cy: 69,  r: 1.2, a: 0.52, d_: 0    },
];

export const CreativeBloom = ({ visible }: { visible: boolean }) => {
    return (
        // Container always occupies space — only path visuals animate, no layout shift
        <div className="w-full flex justify-center print:hidden" aria-hidden>
            <svg
                viewBox="0 0 600 110"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full max-w-3xl text-muted dark:text-muted-dark"
                stroke="currentColor"
            >
                {PATHS.map((spec, i) => (
                    <path
                        key={i}
                        d={spec.d}
                        pathLength={1}
                        style={pathStyle(spec, visible)}
                    />
                ))}
                {DOTS.map((spec, i) => (
                    <circle
                        key={i}
                        cx={spec.cx}
                        cy={spec.cy}
                        r={spec.r}
                        fill="currentColor"
                        stroke="none"
                        style={dotStyle(spec, visible)}
                    />
                ))}
            </svg>
        </div>
    );
};
