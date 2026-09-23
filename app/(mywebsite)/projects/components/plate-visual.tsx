import type { PlateVisualSpec } from "../content/types";
import { ClientShots } from "./client-shots";
import { FigureCanvas } from "./figure-canvas";

export const SOFT_SIDE_EDGES = "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]";

export function PlateVisual({ visual }: { visual: PlateVisualSpec }) {
    if (visual.kind === "clients") return <ClientShots />;
    return (
        <div className={`-mx-4 aspect-[4/3] md:mx-0 md:aspect-[21/9] print:hidden ${SOFT_SIDE_EDGES}`}>
            <FigureCanvas figure={visual.figure} />
        </div>
    );
}
