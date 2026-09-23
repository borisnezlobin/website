"use client";

import { EMAIL_ACTIONS, EMAIL_ADDRESS } from "../channels";
import { useCopyFeedback } from "../lib/use-copy-feedback";
import { ChannelActionControl } from "./channel-action";

type EmailReadoutProps = { onPreview: () => void };

export function EmailReadout({ onPreview }: EmailReadoutProps) {
    const { copied, copy } = useCopyFeedback();

    return (
        <section aria-label="Email" onPointerEnter={onPreview} onFocus={onPreview} className="flex w-full flex-col items-center gap-5 text-center">
            <p className="max-w-full select-text text-2xl leading-tight [overflow-wrap:anywhere] sm:text-3xl md:text-5xl">{EMAIL_ADDRESS}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {EMAIL_ACTIONS.map((action, index) => (
                    <ChannelActionControl
                        key={action.label}
                        action={action}
                        tone={index === 0 ? "solid" : "quiet"}
                        copied={action.kind === "copy" && copied === action.value}
                        onCopy={copy}
                    />
                ))}
            </div>
            <p role="status" className="sr-only">{copied ? `Copied ${copied}` : ""}</p>
        </section>
    );
}
