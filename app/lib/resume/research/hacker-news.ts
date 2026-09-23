import { isRecord, readString } from "../json";
import { safeFetchJson } from "./safe-fetch";

const RECENT_YEARS = 3;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

type Story = { date: string; title: string; url: string };

function readStory(hit: unknown): Story | null {
    if (!isRecord(hit)) return null;
    const title = readString(hit, "title");
    if (!title) return null;
    return { date: (readString(hit, "created_at") ?? "").slice(0, 10), title, url: readString(hit, "url") ?? "" };
}

export async function fetchRecentStories(company: string): Promise<Story[]> {
    const since = Math.floor(Date.now() / 1000) - RECENT_YEARS * SECONDS_PER_YEAR;
    const params = new URLSearchParams({
        query: company,
        tags: "story",
        hitsPerPage: "10",
        numericFilters: `created_at_i>${since}`,
    });
    const data = await safeFetchJson(`https://hn.algolia.com/api/v1/search?${params}`);
    const hits = isRecord(data) && Array.isArray(data.hits) ? data.hits : [];
    return hits.map(readStory).filter((story): story is Story => story !== null);
}

function mentionsCompany(story: Story, company: string, domain: string | null): boolean {
    const escaped = company.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const asWord = new RegExp(`(^|[^a-z0-9-])${escaped}([^a-z0-9-]|$)`, "i");
    return asWord.test(story.title) || Boolean(domain && `${story.title} ${story.url}`.toLowerCase().includes(domain));
}

/** Search matches the name loosely, so keep only stories that clearly concern this company. */
export function relevantStories(stories: Story[], company: string, domain: string | null): string[] {
    return stories
        .filter((story) => mentionsCompany(story, company, domain))
        .slice(0, 5)
        .map((story) => `${story.date} ${story.title}`);
}
