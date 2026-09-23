import type { RenderedResume, ResumePlan } from "../types";
import { finishComposition, fitExactBullets, fitRankedBullets } from "./compose";
import { exactBullets, rankBullets } from "./ranking";
import { STANDARD_BULLET_IDS } from "./standard";

export async function composeResume(plan: ResumePlan): Promise<RenderedResume> {
    const ranked = rankBullets(plan.rankedBulletIds);
    return finishComposition(fitRankedBullets(ranked, { rewrites: plan.rewrites, skillsOrder: plan.skillsOrder }));
}

export async function composeStandardResume(): Promise<RenderedResume> {
    const bullets = exactBullets(STANDARD_BULLET_IDS);
    return finishComposition(fitExactBullets(bullets, { rewrites: [] }));
}
