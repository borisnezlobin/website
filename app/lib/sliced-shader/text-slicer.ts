import { stepSlice, type SliceSpring } from "./plate";
import { createSlicedProgram, type SlicedProgram } from "./program";

/** Band width and slide distance, in em of the sliced text, so the tear scales with the type. */
const BAND_EM = 0.14;
const AMP_EM = 0.14;
/** The quote's full fraying eats small type away, so the text keeps a third of it. */
const DAMAGE = 0.35;
const SEED = 23;
const MAX_DPR = 2;
const MAX_STEP_SECONDS = 0.05;

type TextRun = { text: string; font: string; color: string; x: number; baseline: number };

const fontOf = (style: CSSStyleDeclaration) => `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

/** Every text node under `root`, with the font, colour and position it is drawn at, relative to `origin`. */
function textRunsOf(root: HTMLElement, origin: DOMRect, measure: CanvasRenderingContext2D): TextRun[] {
    const runs: TextRun[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const style = getComputedStyle(node.parentElement ?? root);
        range.selectNodeContents(node);
        const box = range.getBoundingClientRect();
        measure.font = fontOf(style);
        const ascent = measure.measureText(node.textContent ?? "").fontBoundingBoxAscent;
        runs.push({ text: node.textContent ?? "", font: measure.font, color: style.color, x: box.left - origin.left, baseline: box.top - origin.top + ascent });
    }
    return runs;
}

export type TextSlicer = {
    /** Springs the slice towards 1 (torn) or 0 (whole); returns a function that stops the animation. */
    animateTo: (target: number) => () => void;
    dispose: () => void;
};

/**
 * Tears live text with the Writing quote's slice. While the text is whole it is left to the DOM;
 * once it starts to tear, the text is painted into `canvas` and `text` is hidden until it heals.
 */
export function createTextSlicer(text: HTMLElement, canvas: HTMLCanvasElement): TextSlicer | null {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
    if (!gl) return null;
    let program: SlicedProgram;
    try {
        program = createSlicedProgram(gl);
    } catch {
        return null;
    }
    const texture = program.makeTexture();
    const source = document.createElement("canvas");
    const sourceContext = source.getContext("2d")!;
    let spring: SliceSpring = { value: 0, velocity: 0 };
    let em = 16;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const paint = () => {
        const box = text.getBoundingClientRect();
        em = parseFloat(getComputedStyle(text).fontSize);
        const margin = Math.ceil(2 * AMP_EM * em) + 4;
        const width = box.width + 2 * margin;
        const height = box.height + 2 * margin;
        Object.assign(canvas.style, { left: `${-margin}px`, top: `${-margin}px`, width: `${width}px`, height: `${height}px` });
        canvas.width = source.width = Math.round(width * dpr);
        canvas.height = source.height = Math.round(height * dpr);
        sourceContext.setTransform(dpr, 0, 0, dpr, margin * dpr, margin * dpr);
        sourceContext.clearRect(-margin, -margin, width, height);
        sourceContext.textBaseline = "alphabetic";
        for (const run of textRunsOf(text, box, sourceContext)) {
            sourceContext.font = run.font;
            sourceContext.fillStyle = run.color;
            sourceContext.fillText(run.text, run.x, run.baseline);
        }
        program.upload(texture, source);
    };

    const draw = () => {
        program.clear();
        program.draw({
            tex: texture,
            quad: { x: 0, y: 0, w: canvas.width, h: canvas.height },
            progress: spring.value,
            bandPx: BAND_EM * em * dpr,
            amp: AMP_EM * em * dpr,
            damage: DAMAGE,
            seed: SEED,
        });
    };

    const showTorn = (torn: boolean) => {
        canvas.style.visibility = torn ? "visible" : "hidden";
        text.style.opacity = torn ? "0" : "";
    };

    const animateTo = (target: number) => {
        if (target > 0 && spring.value === 0) paint();
        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
            spring = stepSlice(spring, target, Math.min((now - last) / 1000, MAX_STEP_SECONDS));
            last = now;
            draw();
            const resting = spring.value === target && spring.velocity === 0;
            showTorn(!(resting && target === 0));
            if (!resting) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    };

    return { animateTo, dispose: () => program.dispose() };
}
