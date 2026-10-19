import type { CSSProperties, ComponentPropsWithoutRef } from "react";
import type { ProjectMedia } from "../content/media";
import { MEDIA_EDGE } from "./media-styles";

export const mediaRatio = (item: ProjectMedia) => item.width / item.height;

const STAGE_LIMITS = { min: 4 / 5, max: 16 / 9 };
/** An item this close to the stage's shape fills it; the slight crop is worth having no gap. */
const COVER_TOLERANCE = 0.2;

/** One shape per entry, from media.ts alone: its lead item's, kept between 4:5 and 16:9, so the first thing shown fills the box. It never changes while the items do. */
export const stageRatioFor = (items: ProjectMedia[]) => Math.min(STAGE_LIMITS.max, Math.max(STAGE_LIMITS.min, items.length ? mediaRatio(items[0]) : 1));

/**
 * Where an item sits in its stage, in the stage's container units, so the size is known before anything
 * loads. Close to the stage's shape, it fills the stage; further off, it shows whole at its own shape.
 */
export const fitInStage = (item: ProjectMedia, stageRatio: number): CSSProperties => {
    const ratio = mediaRatio(item);
    if (Math.abs(ratio / stageRatio - 1) <= COVER_TOLERANCE) return { width: "100cqw", height: "100cqh" };
    return { aspectRatio: `${ratio}`, width: `min(100cqw, calc(100cqh * ${ratio}))` };
};

/** On the start edge, like the thumbnails, and resting on the bottom edge, right above them. */
export const STAGE_PLACE = "absolute bottom-0 start-0";

type MediaFrameProps = ComponentPropsWithoutRef<"figure">;

/** The rounded edge and hairline ring of a photo or clip, on the media's own box. Callers size and place it. */
export function MediaFrame({ className = "", children, ...rest }: MediaFrameProps) {
    return (
        <figure {...rest} className={`overflow-hidden rounded-lg ${MEDIA_EDGE} ${className}`}>
            {children}
        </figure>
    );
}
