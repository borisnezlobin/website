"use client";

import { ArrowUpRightIcon, CheckIcon, CopyIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { ActionButton, ActionLink, type ActionTone } from "@/app/components/action";
import type { ChannelAction, LinkAction } from "../channels";
import { UI_EASE } from "./tones";

type ChannelActionControlProps = {
    action: ChannelAction;
    tone: ActionTone;
    copied: boolean;
    onCopy: (value: string) => void;
};

export function ChannelActionControl({ action, tone, copied, onCopy }: ChannelActionControlProps) {
    if (action.kind === "link") return <ChannelLink action={action} tone={tone} />;
    return (
        <ActionButton type="button" tone={tone} icon={<CopyStateIcon copied={copied} />} onClick={() => onCopy(action.value)}>
            <SwappingLabel showAlternate={copied} label={action.label} alternate="Copied" />
        </ActionButton>
    );
}

function ChannelLink({ action, tone }: { action: LinkAction; tone: ActionTone }) {
    const external = action.href.startsWith("http");
    const Icon = external ? ArrowUpRightIcon : PaperPlaneTiltIcon;
    const newTab = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    return (
        <ActionLink href={action.href} tone={tone} icon={<Icon weight="bold" className="size-4" />} {...newTab}>
            {action.label}
        </ActionLink>
    );
}

const SWAP = `transition-[opacity,transform,filter] duration-200 ${UI_EASE}`;
const SHOWN = "scale-100 opacity-100 blur-0";
const HIDDEN = "scale-[0.25] opacity-0 blur-sm";

function CopyStateIcon({ copied }: { copied: boolean }) {
    return (
        <span className="relative flex size-4">
            <CopyIcon weight="bold" className={`size-4 ${SWAP} ${copied ? HIDDEN : SHOWN}`} />
            <CheckIcon weight="bold" className={`absolute inset-0 size-4 ${SWAP} ${copied ? SHOWN : HIDDEN}`} />
        </span>
    );
}

function SwappingLabel({ showAlternate, label, alternate }: { showAlternate: boolean; label: string; alternate: string }) {
    return (
        <span className="grid text-inherit">
            <span className={`col-start-1 row-start-1 text-inherit ${showAlternate ? "invisible" : ""}`}>{label}</span>
            <span className={`col-start-1 row-start-1 text-inherit ${showAlternate ? "" : "invisible"}`}>{alternate}</span>
        </span>
    );
}
