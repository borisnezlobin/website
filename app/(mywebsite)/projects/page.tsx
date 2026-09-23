import getMetadata from "../../lib/metadata";
import { INDEX_ROWS } from "./content/index-rows";
import { PLATES } from "./content/plates";
import { Plate } from "./components/plate";
import { PlateRail, type RailItem } from "./components/plate-rail";
import { INDEX_SECTION_ID, ProjectIndex } from "./components/project-index";

export const metadata = getMetadata({
    title: "Projects.",
    subtitle: "From solar physics at Lockheed Martin to a spatial computing startup",
    description: "Things Boris Nezlobin has built, with figures drawn from their real data.",
});

const RAIL_ITEMS: RailItem[] = [
    ...PLATES.map(({ id, title }) => ({ id, title })),
    { id: INDEX_SECTION_ID, title: "More projects" },
];

export default function ProjectsPage() {
    return (
        <main className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:grid lg:grid-cols-[10rem_1fr] lg:gap-12">
            <PlateRail items={RAIL_ITEMS} />
            <div className="min-w-0">
                <h1 className="mt-8 vectra text-5xl font-normal">Projects.</h1>
                <div>
                    {PLATES.map((plate) => (
                        <Plate key={plate.id} plate={plate} />
                    ))}
                </div>
                <ProjectIndex rows={INDEX_ROWS} />
            </div>
        </main>
    );
}
