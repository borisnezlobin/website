import type { PrintBody } from "./print-body";

/**
 * Writes a print's pose into its DOM elements. Everything is a transform or an opacity, so the
 * browser can move fifteen prints a frame on the compositor. The shadow is a blurred sibling under
 * the print, offset down and to the right (the light is up and to the left), and it moves further
 * out as the print bobs, is lifted by a hover, or rides up over a rock it was stuck on.
 */
export type PrintElements = { root: HTMLElement; shadow: HTMLElement };

const BOB_SPEED = 1.7;
const LIFT_SCALE = 0.05;

const bob = (body: PrintBody, time: number) => 0.5 + 0.5 * Math.sin(time * BOB_SPEED + body.seed * 40);

/** Size changes only on resize; skipping unchanged writes keeps per-frame updates off the layout path. */
function applySize(element: HTMLElement, body: PrintBody) {
    const key = `${body.width.toFixed(1)}x${body.height.toFixed(1)}`;
    if (element.dataset.size === key) return;
    element.dataset.size = key;
    element.style.width = `${body.width}px`;
    element.style.height = `${body.height}px`;
}

const placement = (x: number, y: number, angle: number, scale: number) =>
    `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad) scale(${scale})`;

export function applyPrintPose(elements: PrintElements, body: PrintBody, time: number) {
    const { root, shadow } = elements;
    const raised = Math.max(body.hold, body.rise * 0.7);
    const lift = raised + bob(body, time) * 0.25 * (1 - raised);
    const scale = 1 + raised * LIFT_SCALE + bob(body, time) * 0.006;
    const left = body.x - body.width / 2, top = body.y - body.height / 2;
    const offset = 2 + lift * 9;
    applySize(root, body);
    applySize(shadow, body);
    root.style.transform = placement(left, top, body.angle, scale);
    shadow.style.transform = placement(left + offset * 0.6, top + offset, body.angle, scale * 0.99);
    shadow.style.opacity = String(0.5 - lift * 0.16);
}
