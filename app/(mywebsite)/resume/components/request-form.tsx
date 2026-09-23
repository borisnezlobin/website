"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PenNibIcon } from "@phosphor-icons/react/dist/ssr";
import { useTypedPlaceholder } from "../lib/use-typed-placeholder";
import { ActionButton } from "@/app/components/action";

const LONGEST_REQUEST = 4000;

function submitsOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    return event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;
}

type RequestFormProps = {
    onSubmit: (request: string) => void;
    onDraftChange?: (draft: string) => void;
};

export function RequestForm({ onSubmit, onDraftChange }: RequestFormProps) {
    const [request, setRequest] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    const placeholder = useTypedPlaceholder(request.length > 0);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = request.trim();
        if (trimmed) onSubmit(trimmed);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!submitsOnEnter(event)) return;
        event.preventDefault();
        formRef.current?.requestSubmit();
    };

    return (
        <form ref={formRef} onSubmit={submit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <label htmlFor="resume-request" className="sr-only">
                The role you’re hiring for, the skills you need, or a link to the job posting
            </label>
            <textarea
                id="resume-request"
                name="request"
                rows={2}
                required
                maxLength={LONGEST_REQUEST}
                value={request}
                onChange={(event) => {
                    setRequest(event.target.value);
                    onDraftChange?.(event.target.value);
                }}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="min-h-[3.5rem] w-full flex-1 resize-none rounded-lg border border-black/10 bg-white/85 px-5 py-4 text-lg leading-snug text-light-foreground shadow-sm outline-none backdrop-blur-sm transition-shadow [field-sizing:content] placeholder:text-muted focus:border-transparent focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-dark-background/70 dark:text-dark-foreground dark:placeholder:text-muted-dark"
            />
            <ActionButton type="submit" disabled={!request.trim()} icon={<PenNibIcon weight="bold" className="size-4" />} className="sm:mb-1">
                Make a resume for this role
            </ActionButton>
        </form>
    );
}
