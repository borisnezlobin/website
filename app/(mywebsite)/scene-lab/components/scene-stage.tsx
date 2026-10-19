import type { ReactNode } from "react";
import type { Scene } from "../directions";
import { LabNav } from "./lab-nav";

/** One full screen below the top bar, which is what each section of the projects page gets. */
export function SceneStage({ scene, direction, children }: { scene: Scene["slug"]; direction: string; children: ReactNode }) {
    return (
        <main className="relative h-[calc(100svh-3rem)] w-full overflow-hidden">
            <h1 className="sr-only">{`${scene} preview: ${direction}`}</h1>
            {children}
            <LabNav scene={scene} direction={direction} />
        </main>
    );
}
