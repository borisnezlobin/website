import { ashbyAdapter } from "./ashby";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { recruiteeAdapter } from "./recruitee";
import { ripplingAdapter } from "./rippling";
import { smartRecruitersAdapter } from "./smartrecruiters";
import { workableAdapter } from "./workable";
import { workdayAdapter } from "./workday";
import type { PostingAdapter, RawPosting } from "./types";

export type { RawPosting } from "./types";

const ADAPTERS: PostingAdapter[] = [
    workdayAdapter,
    greenhouseAdapter,
    leverAdapter,
    ashbyAdapter,
    smartRecruitersAdapter,
    workableAdapter,
    recruiteeAdapter,
    ripplingAdapter,
];

export type MatchedAdapter = { name: string; read: () => Promise<RawPosting> };

export function findAdapter(rawUrl: string): MatchedAdapter | null {
    const url = new URL(rawUrl);
    for (const adapter of ADAPTERS) {
        const target = adapter.detect(url);
        if (target === null || target === undefined) continue;
        return { name: adapter.name, read: () => adapter.read(target as never, rawUrl) };
    }
    return null;
}
