export type InkStyle = {
    ink: [number, number, number];
    accents: [number, number, number][];
    accentChance: number;
    lineWidth: number;
    degree: number;
    nearPool: number;
    longChance: number;
    maxSpan: number;
    scatter: number;
    density: number;
    densityFlicker: number;
    paleRelief: number;
    paleEdge: number;
    flashCount: number;
    flashChance: number;
    flashDistance: number;
    nodeChance: number;
    nodeRadius: number;
    symbolCount: number;
    symbolSize: [number, number];
    displace: number;
    finSeparation: number;
    finMaxSpan: number;
    eyeSize: number;
    seed: number;
    halo: [number, number];
    chromatic: number;
    echoOffset: number;
    echoTint: [number, number, number];
    echoStrength: number;
    bandChance: number;
    bandCount: number;
    bandThickness: [number, number];
    bandShift: number;
    smearChance: number;
    smearCount: number;
    smearLength: number;
    smearStep?: number;
    symbolWeight?: number;
    underlay?: boolean;
    negativeInDark?: boolean;
    bow?: number;
    hold?: number;
};

const GRAPHITE: [number, number, number] = [28, 26, 32];
const SLATE: [number, number, number] = [72, 70, 86];
const HAZE: [number, number, number] = [128, 126, 148];
const TEAL: [number, number, number] = [14, 132, 148];
const EMBER: [number, number, number] = [255, 148, 132];
const RED: [number, number, number] = [204, 42, 38];
const PURPLE: [number, number, number] = [124, 58, 214];
const MAGENTA: [number, number, number] = [206, 32, 148];

const quiet = {
    halo: [0, 0], chromatic: 0, echoOffset: 0, echoTint: [255, 255, 255],
    echoStrength: 0, bandChance: 0, bandCount: 0, bandThickness: [6, 40],
    bandShift: 0, smearChance: 0, smearCount: 0, smearLength: 0,
} as const;

export const INK_STYLES: Record<string, InkStyle> = {
    scribble: {
        ...quiet,
        ink: GRAPHITE, accents: [RED, PURPLE], accentChance: 0.05, lineWidth: 1.0,
        degree: 7, nearPool: 24, longChance: 0.02, maxSpan: 155, scatter: 2.2,
        density: 0.95, densityFlicker: 0.18, paleRelief: 0.9, paleEdge: 0.25,
        flashCount: 7, flashChance: 0.22, flashDistance: 14, nodeChance: 0.015,
        nodeRadius: 2, symbolCount: 2, symbolSize: [8, 20], displace: 2,
        finSeparation: 0.42, finMaxSpan: 54, eyeSize: 9, seed: 11, hold: 3,
        bow: 0.25, negativeInDark: true,
    } as InkStyle,
    ranting: {
        ...quiet,
        ink: GRAPHITE, accents: [RED, PURPLE, MAGENTA], accentChance: 0.13, lineWidth: 1.0,
        degree: 4, nearPool: 22, longChance: 0.06, maxSpan: 230, scatter: 5.2,
        density: 0.85, densityFlicker: 0.26, paleRelief: 0.85, paleEdge: 0.25,
        flashCount: 14, flashChance: 0.3, flashDistance: 0, nodeChance: 0.05,
        nodeRadius: 2.4, symbolCount: 40, symbolSize: [16, 54], displace: 3,
        finSeparation: 0, finMaxSpan: 0, eyeSize: 9, seed: 29, symbolWeight: 2.2,
        chromatic: 5, bandChance: 0.32, bandCount: 2, bandThickness: [8, 60],
        bandShift: 26, smearChance: 0.5, smearCount: 2, smearLength: 5,
    } as InkStyle,
    plain: {
        ...quiet,
        ink: GRAPHITE, accents: [GRAPHITE], accentChance: 0, lineWidth: 1.0,
        degree: 1, nearPool: 4, longChance: 0, maxSpan: 1, scatter: 0,
        density: 0, densityFlicker: 0, paleRelief: 0, paleEdge: 0.25,
        flashCount: 0, flashChance: 0, flashDistance: 0, nodeChance: 0,
        nodeRadius: 0, symbolCount: 0, symbolSize: [1, 2], displace: 0,
        finSeparation: 0, finMaxSpan: 0, eyeSize: 0, seed: 3, underlay: true,
    } as InkStyle,
    damage: {
        ...quiet,
        ink: SLATE, accents: [RED, MAGENTA, PURPLE], accentChance: 0.5, lineWidth: 1.0,
        degree: 2, nearPool: 12, longChance: 0.03, maxSpan: 100, scatter: 3,
        density: 0.5, densityFlicker: 0.5, paleRelief: 0.95, paleEdge: 0.25,
        flashCount: 9, flashChance: 0.28, flashDistance: 0, nodeChance: 0.04,
        nodeRadius: 2.4, symbolCount: 5, symbolSize: [9, 30], displace: 3,
        finSeparation: 0, finMaxSpan: 0, eyeSize: 0, seed: 71, underlay: true,
        chromatic: 4, bandChance: 0.45, bandCount: 3, bandThickness: [8, 60], bandShift: 26,
    } as InkStyle,
    breakdown: {
        ...quiet,
        ink: HAZE, accents: [RED, MAGENTA, TEAL, RED, PURPLE], accentChance: 0.5, lineWidth: 1.0,
        degree: 3, nearPool: 20, longChance: 0.04, maxSpan: 140, scatter: 4.2,
        density: 0.98, densityFlicker: 0.5, paleRelief: 0.85, paleEdge: 0.25,
        flashCount: 14, flashChance: 0.35, flashDistance: 0, nodeChance: 0.07,
        nodeRadius: 2.8, symbolCount: 6, symbolSize: [10, 40], displace: 5,
        finSeparation: 0, finMaxSpan: 0, eyeSize: 9, seed: 53, underlay: true,
        halo: [7, 0.3], chromatic: 7, echoOffset: 12, echoTint: EMBER, echoStrength: 0.3,
        bandChance: 0.6, bandCount: 4, bandThickness: [10, 90], bandShift: 42,
        smearChance: 0.5, smearCount: 3, smearLength: 9,
    } as InkStyle,
};

export function frenzied(style: InkStyle): InkStyle {
    const hover: InkStyle = {
        ...style,
        degree: style.degree + 1,
        longChance: Math.min(style.longChance * 2, 0.1),
        maxSpan: style.maxSpan * 1.15,
        scatter: style.scatter * 1.5,
        densityFlicker: Math.min(style.densityFlicker * 1.2, 0.5),
        flashCount: Math.round(style.flashCount * 1.5),
        flashChance: Math.min(style.flashChance * 1.4, 0.6),
        nodeChance: Math.min(style.nodeChance * 1.5, 0.12),
        symbolCount: Math.round(style.symbolCount * 1.5) + 2,
        chromatic: style.chromatic + 3,
        bandChance: Math.min(style.bandChance + 0.2, 0.7),
        bandCount: style.bandCount + 1,
        bandShift: style.bandShift + 12,
        smearChance: style.smearLength ? Math.min(style.smearChance + 0.15, 0.7) : 0,
        displace: style.displace + 2,
        echoOffset: style.echoOffset + 3,
        echoStrength: Math.min(style.echoStrength + 0.12, 0.55),
        seed: style.seed + 500,
    };
    if (style === INK_STYLES.scribble) {
        return { ...hover, lineWidth: 0.65, degree: 6, density: 0.68, densityFlicker: 0.34 };
    }
    return hover;
}

export function atScale(style: InkStyle, scale: number): InkStyle {
    if (scale === 1) return style;
    const px = (value: number) => Math.round(value * scale);
    return {
        ...style,
        lineWidth: style.lineWidth,
        chromatic: px(style.chromatic),
        halo: [style.halo[0] * scale, style.halo[1]],
        echoOffset: px(style.echoOffset),
        bandShift: px(style.bandShift),
        bandThickness: [Math.max(1, px(style.bandThickness[0])), Math.max(2, px(style.bandThickness[1]))],
        displace: px(style.displace),
        smearStep: Math.max(1, px(3)),
    } as InkStyle;
}
