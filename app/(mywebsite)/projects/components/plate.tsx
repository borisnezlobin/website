import type { PlateContent } from "../content/types";
import { PlateHighlights } from "./plate-highlights";
import { PlateLinks } from "./plate-links";
import { PlateVisual } from "./plate-visual";

const PLATE_SPACING = "py-24 first:pt-8 md:py-36 md:first:pt-12";
const LAND_FIGURE_BELOW_TOP_BAR = "-scroll-mt-4 first:scroll-mt-12 md:-scroll-mt-16 md:first:scroll-mt-8";

export function Plate({ plate }: { plate: PlateContent }) {
    const titleId = `${plate.id}-title`;
    return (
        <section id={plate.id} aria-labelledby={titleId} className={`${PLATE_SPACING} ${LAND_FIGURE_BELOW_TOP_BAR}`}>
            <PlateVisual visual={plate.visual} />
            <div className="mt-6 max-w-2xl md:mt-8">
                <h2 id={titleId} className="text-3xl font-bold">
                    {plate.title}
                </h2>
                <PlateHighlights highlights={plate.highlights} />
                <p className="mt-4 leading-relaxed">{plate.summary}</p>
                <PlateLinks links={plate.links} />
            </div>
        </section>
    );
}
