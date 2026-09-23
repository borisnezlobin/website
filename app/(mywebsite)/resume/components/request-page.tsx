"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr";
import { STANDARD_SLUG } from "@/app/lib/resume/types";
import { DECLINED_PATH, resumePath } from "../lib/slug";
import { useResumeGeneration } from "../lib/use-resume-generation";
import { ActionLink } from "@/app/components/action";
import { GenerationPanel } from "./generation-panel";
import { RequestForm } from "./request-form";
import { CanopyBackdrop } from "./resume-frame";
import { StandardPreview } from "./standard-preview";
import { Tagline } from "./tagline";

export function RequestPage({ standardSheetUrl }: { standardSheetUrl: string | null }) {
    const router = useRouter();
    const [request, setRequest] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const { state, start } = useResumeGeneration({
        onDone: (slug) => router.push(resumePath(slug)),
        onDeclined: () => router.push(DECLINED_PATH),
    });

    const begin = (text: string) => {
        setRequest(text);
        void start({ query: text });
    };

    if (request !== null && state.phase !== "idle") {
        return <GenerationPanel state={state} request={request} onRetry={() => begin(request)} />;
    }

    return (
        <main className="relative select-text">
            <CanopyBackdrop reach="tall" />
            <section className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pb-32 pt-[clamp(10rem,30vh,17rem)] sm:px-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <section className="flex flex-col items-start gap-8">
                    <hgroup className="flex flex-col gap-4">
                        <h1 className="vectra text-5xl sm:text-7xl lg:text-8xl leading-none text-muted [text-wrap:balance] dark:text-muted-dark">
                            Hire me
                        </h1>
                        <Tagline draft={draft} />
                    </hgroup>
                    <RequestForm onSubmit={begin} onDraftChange={setDraft} />
                    <ActionLink href={resumePath(STANDARD_SLUG)} icon={<FileTextIcon className="size-4" />} className="lg:hidden">
                        Read my standard resume
                    </ActionLink>
                </section>
                <StandardPreview sheetUrl={standardSheetUrl} />
            </section>
        </main>
    );
}
