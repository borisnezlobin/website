"use client";

import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../components/button";

type DeletePhase = "idle" | "confirming" | "deleting";

export type ConfirmDeleteProps = {
  idleLabel: string;
  question: React.ReactNode;
  confirmLabel: string;
  keepLabel: string;
  errorPrefix: string;
  onConfirm: () => Promise<string | null>;
  onDeleted: () => void;
  iconOnly?: boolean;
};

export default function ConfirmDelete({
  idleLabel,
  question,
  confirmLabel,
  keepLabel,
  errorPrefix,
  onConfirm,
  onDeleted,
  iconOnly = false,
}: ConfirmDeleteProps) {
  const [phase, setPhase] = useState<DeletePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === "confirming") keepButton.current?.focus();
  }, [phase]);

  function cancel() {
    setPhase("idle");
    setError(null);
    requestAnimationFrame(() => startButton.current?.focus());
  }

  async function confirm() {
    setPhase("deleting");
    setError(null);
    const failure = await onConfirm();
    if (failure) {
      setError(failure);
      setPhase("confirming");
      return;
    }
    onDeleted();
  }

  if (phase === "idle") {
    return (
      <Button
        ref={startButton}
        variant="secondary"
        size="sm"
        aria-label={iconOnly ? idleLabel : undefined}
        title={iconOnly ? idleLabel : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setPhase("confirming");
        }}
        className={iconOnly ? "px-2" : undefined}
      >
        <TrashIcon size={16} aria-hidden />
        {!iconOnly && idleLabel}
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label={idleLabel}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.key === "Escape" && cancel()}
      className="flex flex-col items-end gap-2"
    >
      <span className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm">{question}</span>
        <Button ref={keepButton} variant="ghost" size="sm" onClick={cancel} disabled={phase === "deleting"}>
          {keepLabel}
        </Button>
        <Button variant="danger" size="sm" onClick={confirm} disabled={phase === "deleting"}>
          <TrashIcon size={16} weight="bold" aria-hidden />
          {phase === "deleting" ? "Deleting…" : confirmLabel}
        </Button>
      </span>
      {error && (
        <span role="alert" className="text-sm text-primary">
          {errorPrefix} {error}
        </span>
      )}
    </span>
  );
}
