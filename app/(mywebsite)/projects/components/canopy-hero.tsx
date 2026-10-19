import type { RefObject } from "react";
import type { ProjectClaim } from "../content/types";
import { ClaimFan } from "./claim-fan";

type CanopyHeroProps = {
    claims: ProjectClaim[];
    canvasRef: RefObject<HTMLCanvasElement | null>;
    /** Without a canvas the hero is just the fan on the page. */
    plain: boolean;
    onCanopyFloor: (px: number) => void;
};

/** Above the fold: the weeping cherry hanging from the top bar, and "I do stuff." fanning out into the three claims. */
export function CanopyHero({ claims, canvasRef, plain, onCanopyFloor }: CanopyHeroProps) {
    return (
        <section className="relative flex h-[calc(100svh-3rem)] flex-col justify-end px-4 pb-24 md:pb-28 md:pl-28 md:pr-8">
            {!plain && <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block size-full [image-rendering:pixelated]" />}
            <h1 className="sr-only">Projects</h1>
            <ClaimFan claims={claims} onCanopyFloor={onCanopyFloor} />
        </section>
    );
}
