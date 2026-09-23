"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { FOCUS_RING } from "@/app/components/action";
import { CHANNELS, EMAIL_STATION, type Channel } from "../channels";
import { UI_EASE } from "./tones";

const PILL = `group inline-flex min-h-11 items-center gap-2 rounded-full bg-neutral-200/70 px-4 transition-colors duration-150 ${UI_EASE} hover:bg-neutral-300/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 ${FOCUS_RING}`;

type ChannelLinksProps = {
    onPreview: (station: number) => void;
    onLeave: () => void;
};

export function ChannelLinks({ onPreview, onLeave }: ChannelLinksProps) {
    return (
        <ul aria-label="Other ways to reach me" onPointerLeave={onLeave} onBlur={onLeave} className="flex list-none flex-wrap justify-center gap-2">
            {CHANNELS.map((channel, station) =>
                station === EMAIL_STATION ? null : (
                    <li key={channel.id}>
                        <ChannelPill channel={channel} onPreview={() => onPreview(station)} />
                    </li>
                ),
            )}
        </ul>
    );
}

function ChannelPill({ channel, onPreview }: { channel: Channel; onPreview: () => void }) {
    const Glyph = channel.icon;
    return (
        <a
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            onPointerEnter={onPreview}
            onPointerDown={onPreview}
            onFocus={onPreview}
            className={PILL}
        >
            <Glyph aria-hidden="true" weight="fill" className="size-5" />
            <span className="text-inherit">{channel.name}</span>
            <ArrowUpRightIcon aria-hidden="true" weight="bold" className="size-3.5 opacity-50 transition-opacity duration-150 group-hover:opacity-100" />
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    );
}
