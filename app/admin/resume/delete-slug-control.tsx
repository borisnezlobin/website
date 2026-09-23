"use client";

import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../components/button";
import { resumePath } from "./format";
import { useDeleteSlug } from "./use-resume-requests";

type DeletePhase = "idle" | "confirming" | "deleting";

export default function DeleteSlugControl({ slug, onDeleted }: { slug: string; onDeleted: () => void }) {
  const deleteSlug = useDeleteSlug();
  const [phase, setPhase] = useState<DeletePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === "confirming") keepButton.current?.focus();
  }, [phase]);

  function cancel() {
    setPhase("idle");
    requestAnimationFrame(() => startButton.current?.focus());
  }

  async function confirm() {
    setPhase("deleting");
    setError(null);
    const failure = await deleteSlug(slug);
    if (failure) {
      setError(failure);
      setPhase("confirming");
      return;
    }
    onDeleted();
  }

  if (phase === "idle") {
    return (
      <Button ref={startButton} variant="secondary" size="sm" onClick={() => setPhase("confirming")}>
        <TrashIcon size={16} aria-hidden />
        Delete slug
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label="Confirm slug deletion"
      onKeyDown={(event) => event.key === "Escape" && cancel()}
      className="flex flex-col items-end gap-2"
    >
      <span className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm">
          Delete <span className="font-mono">{resumePath(slug)}</span> and its PDF? The request stays logged.
        </span>
        <Button ref={keepButton} variant="ghost" size="sm" onClick={cancel} disabled={phase === "deleting"}>
          Keep slug
        </Button>
        <Button variant="danger" size="sm" onClick={confirm} disabled={phase === "deleting"}>
          <TrashIcon size={16} weight="bold" aria-hidden />
          {phase === "deleting" ? "Deleting…" : "Delete for good"}
        </Button>
      </span>
      {error && (
        <span role="alert" className="text-sm text-primary">
          Couldn&apos;t delete the slug. {error}
        </span>
      )}
    </span>
  );
}
