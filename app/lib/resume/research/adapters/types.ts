export type RawPosting = {
    title: string | null;
    company: string | null;
    location: string | null;
    text: string;
};

export type PostingAdapter = {
    name: string;
    /** Returns whatever the reader needs when this adapter recognises the URL, else null. */
    detect: (url: URL) => unknown;
    read: (target: never, url: string) => Promise<RawPosting>;
};

export function defineAdapter<T>(adapter: {
    name: string;
    detect: (url: URL) => T | null;
    read: (target: T, url: string) => Promise<RawPosting>;
}): PostingAdapter {
    return adapter as PostingAdapter;
}

export function pathSegments(url: URL): string[] {
    return url.pathname.split("/").filter(Boolean);
}

/** Boards often prefix a locale, as in /en-US/CareerSite/job/... */
export function withoutLocale(segments: string[]): string[] {
    return segments.length > 0 && /^[a-z]{2}([-_][A-Za-z]{2})?$/.test(segments[0]) ? segments.slice(1) : segments;
}
