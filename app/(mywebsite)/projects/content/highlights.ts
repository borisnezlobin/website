import type { PlateHighlight } from "./types";

export function highlightText(highlight: PlateHighlight): string {
    return typeof highlight === "string" ? highlight : highlight.text;
}

export function isWon(highlight: PlateHighlight): boolean {
    return typeof highlight !== "string";
}
