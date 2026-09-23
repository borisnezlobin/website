"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenerationPanel } from "../components/generation-panel";
import { DECLINED_PATH, headingFromSlug, queryFromSlug, resumePath } from "../lib/slug";
import { useResumeGeneration } from "../lib/use-resume-generation";

export function GenerateOnVisit({ slug }: { slug: string }) {
    const router = useRouter();
    const query = queryFromSlug(slug);

    const { state, start } = useResumeGeneration({
        onDone: (madeSlug) => (madeSlug === slug ? router.refresh() : router.replace(resumePath(madeSlug))),
        onDeclined: () => router.replace(DECLINED_PATH),
    });

    const generate = useCallback(() => void start({ query, slugHint: slug }), [start, query, slug]);

    // Deferred a tick so Strict Mode's mount-unmount-mount in development sends one request, not two.
    useEffect(() => {
        const timer = window.setTimeout(generate, 0);
        return () => window.clearTimeout(timer);
    }, [generate]);

    return <GenerationPanel state={state} request={headingFromSlug(slug)} onRetry={generate} />;
}
