import { Chip } from "@/app/components/landing/chip";

export function PlateHighlights({ highlights }: { highlights: string[] }) {
    if (highlights.length === 0) return null;
    return (
        <ul className="mt-4 flex list-none flex-wrap gap-2">
            {highlights.map((highlight) => (
                <li key={highlight}>
                    <Chip highlight>{highlight}</Chip>
                </li>
            ))}
        </ul>
    );
}
