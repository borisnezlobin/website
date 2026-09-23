import type { CatalogBullet } from "./catalog";
import { FILL_MAX, FILL_MIN, FLOOR, MINIMUM_BULLETS, SPACING_RANGE, SPACING_STEP, TYPOGRAPHY_PREFERENCE, type Typography } from "./typesetting";
import type { Measurement } from "./typst";

export type Attempt = { bullets: CatalogBullet[]; typography: Typography; measurement: Measurement };

/** Lays out the first `count` ranked bullets at the given typography and reports where the page ended. */
export type Trial = (count: number, typography: Typography) => Attempt;

export function fits(attempt: Attempt): boolean {
    return attempt.measurement.page === 1 && attempt.measurement.fill <= FILL_MAX;
}

export function isFilled(attempt: Attempt): boolean {
    return fits(attempt) && attempt.measurement.fill >= FILL_MIN;
}

/** Binary search for the most ranked bullets that still fit one page at the readability floor. */
export function mostBulletsThatFit(trial: Trial, rankedCount: number): { count: number; attempt: Attempt } {
    let low = Math.min(MINIMUM_BULLETS, rankedCount);
    let high = rankedCount;
    let best = { count: low, attempt: trial(low, FLOOR) };
    if (!fits(best.attempt)) return best;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const attempt = trial(middle, FLOOR);
        if (fits(attempt)) {
            low = middle;
            best = { count: middle, attempt };
        } else {
            high = middle - 1;
        }
    }
    return best;
}

function largestTypographyThatFits(trial: Trial, count: number, floorAttempt: Attempt): Attempt {
    for (const typography of TYPOGRAPHY_PREFERENCE) {
        const attempt = trial(count, typography);
        if (fits(attempt)) return attempt;
    }
    return floorAttempt;
}

function stretchToFill(trial: Trial, count: number, start: Attempt): Attempt {
    let chosen = start;
    while (chosen.measurement.fill < FILL_MIN && chosen.typography.spacing < SPACING_RANGE[1] - 1e-9) {
        const spacing = Math.min(SPACING_RANGE[1], chosen.typography.spacing + SPACING_STEP);
        const attempt = trial(count, { fontSize: chosen.typography.fontSize, spacing });
        if (!fits(attempt)) break;
        chosen = attempt;
    }
    return chosen;
}

/** With the content fixed, take the largest type and loosest spacing that fits, then loosen spacing to fill the page. */
export function nicestTypography(trial: Trial, count: number, floorAttempt: Attempt): Attempt {
    return stretchToFill(trial, count, largestTypographyThatFits(trial, count, floorAttempt));
}
