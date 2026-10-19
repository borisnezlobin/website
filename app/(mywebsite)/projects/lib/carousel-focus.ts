import type { KeyboardEvent } from "react";

const TABBABLE = "a[href], button, input, select, textarea, [tabindex]";
export const THUMB_ATTR = "data-carousel-thumb";

function pageTabbables(outside: HTMLElement) {
    return Array.from(document.querySelectorAll<HTMLElement>(TABBABLE)).filter(
        (el) => el.tabIndex >= 0 && !el.hasAttribute("disabled") && !el.closest("[inert]") && !outside.contains(el) && el.getClientRects().length > 0,
    );
}

const thumbsIn = (panel: HTMLElement) => Array.from(panel.querySelectorAll<HTMLElement>(`[${THUMB_ATTR}]`));

/** Where Tab should go instead of the browser's next stop: an element, the panel's first or last thumbnail, or null to leave it alone. */
type Route = HTMLElement | "first" | "last" | null;

function stepFromThumb(thumbs: HTMLElement[], at: number, back: boolean, before?: HTMLElement, after?: HTMLElement): Route {
    return thumbs[at + (back ? -1 : 1)] ?? (back ? before : after) ?? null;
}

function routeTab(target: EventTarget, back: boolean, row: HTMLElement, panel: HTMLElement): Route {
    const page = pageTabbables(panel);
    const inRow = page.filter((el) => row.contains(el));
    const lastInRow = inRow[inRow.length - 1];
    const afterRow = lastInRow ? page[page.indexOf(lastInRow) + 1] : undefined;
    const thumbs = thumbsIn(panel);
    const at = thumbs.indexOf(target as HTMLElement);
    if (at >= 0) return stepFromThumb(thumbs, at, back, lastInRow, afterRow);
    if (!back && target === lastInRow) return "first";
    if (back && target === afterRow) return "last";
    return null;
}

/**
 * The spotlight panel sits after the whole list in the DOM, so that it can stay sticky in its own column.
 * Its thumbnails are left out of the natural tab order, and Tab is routed by hand instead: from the open
 * row's last link into its thumbnails, along them, and on to the next row, with Shift+Tab undoing each step.
 * `showOpenEntry` brings the open entry back into the panel and says whether it had to, in which case the
 * thumbnails are focused once they have rendered.
 */
export function bridgeTab(event: KeyboardEvent, row: HTMLElement | null, panel: HTMLElement | null, showOpenEntry: () => boolean) {
    if (event.key !== "Tab" || !row || !panel) return;
    const route = routeTab(event.target, event.shiftKey, row, panel);
    if (route === null) return;
    event.preventDefault();
    if (route instanceof HTMLElement) return route.focus();
    const focusThumb = () => {
        const thumbs = thumbsIn(panel);
        thumbs[route === "first" ? 0 : thumbs.length - 1]?.focus();
    };
    if (showOpenEntry()) requestAnimationFrame(() => requestAnimationFrame(focusThumb));
    else focusThumb();
}
