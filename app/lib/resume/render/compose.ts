import type { RenderedResume, ResumePlan } from "../types";
import type { CatalogBullet } from "./catalog";
import { fits, isFilled, mostBulletsThatFit, nicestTypography, type Attempt, type Trial } from "./fit";
import { FLOOR } from "./typesetting";
import { capPerEntry } from "./ranking";
import { selectSections, withTypography } from "./selection";
import { headerTexture } from "./texture/header-texture";
import { compileSelection, exportDocument, releaseCompileCache } from "./typst";

type Styling = Omit<ResumePlan, "rankedBulletIds">;

export type Composition = { attempt: Attempt; trials: number };

function makeTrial(ranked: CatalogBullet[], styling: Styling, onTrial: () => void): Trial {
    const texture = headerTexture();
    return (count, typography) => {
        onTrial();
        const bullets = capPerEntry(ranked.slice(0, count));
        const sections = selectSections({ bullets, rewrites: styling.rewrites, skillsOrder: styling.skillsOrder });
        const measurement = compileSelection(withTypography(sections, typography), texture);
        return { bullets, typography, measurement };
    };
}

export function fitRankedBullets(ranked: CatalogBullet[], styling: Styling): Composition {
    let trials = 0;
    const trial = makeTrial(ranked, styling, () => trials++);
    const fitted = mostBulletsThatFit(trial, ranked.length);
    return { attempt: nicestTypography(trial, fitted.count, fitted.attempt), trials };
}

export function fitExactBullets(bullets: CatalogBullet[], styling: Styling): Composition {
    let trials = 0;
    const trial = makeTrial(bullets, styling, () => trials++);
    const floorAttempt = trial(bullets.length, FLOOR);
    if (fits(floorAttempt)) return { attempt: nicestTypography(trial, bullets.length, floorAttempt), trials };
    const fitted = mostBulletsThatFit(trial, bullets.length);
    return { attempt: nicestTypography(trial, fitted.count, fitted.attempt), trials };
}

function describeMiss(attempt: Attempt): string {
    const { page, fill } = attempt.measurement;
    return `resume ended on page ${page} at ${Math.round(fill * 100)}% with ${attempt.bullets.length} bullets`;
}

export function finishComposition({ attempt }: Composition): RenderedResume {
    if (!fits(attempt)) throw new Error(`resume does not fit one page: ${describeMiss(attempt)}`);
    if (!isFilled(attempt)) console.warn(`resume underfilled: ${describeMiss(attempt)}`);
    const { pdf, pageSvgs } = exportDocument(attempt.measurement.document);
    releaseCompileCache();
    return { pdf, pageSvgs, bulletIds: attempt.bullets.map((bullet) => bullet.id), fill: attempt.measurement.fill };
}
