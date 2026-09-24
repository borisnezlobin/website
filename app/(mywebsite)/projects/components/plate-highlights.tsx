import { Chip } from "@/app/components/landing/chip";
import type { PlateHighlight } from "../content/types";

export function highlightText(highlight: PlateHighlight): string {
    return typeof highlight === "string" ? highlight : highlight.text;
}

export function isWon(highlight: PlateHighlight): boolean {
    return typeof highlight !== "string";
}

export function PlateHighlights({ highlights }: { highlights: PlateHighlight[] }) {
    if (highlights.length === 0) return null;
    return (
        <ul className="mt-4 flex list-none flex-wrap gap-2">
            {highlights.map((highlight) => (
                <li key={highlightText(highlight)}>
                    <Chip>{highlightText(highlight)}</Chip>
                </li>
            ))}
        </ul>
    );
}
