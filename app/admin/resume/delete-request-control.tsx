"use client";

import { useState } from "react";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useResumeDeletes } from "./use-resume-requests";

export default function DeleteRequestControl({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { deleteRequest } = useResumeDeletes();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove(event: React.MouseEvent) {
    event.stopPropagation();
    setBusy(true);
    setFailed(false);
    try {
      await deleteRequest(id);
      onDeleted();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={failed ? "Deleting failed, try again" : "Delete request"}
      title={failed ? "Deleting failed, try again" : "Delete request"}
      className={`rounded-lg p-2 transition-colors hover:bg-primary-light-bg hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 dark:hover:bg-primary-dark-bg ${
        failed ? "text-primary" : "text-muted dark:text-muted-dark"
      }`}
    >
      <TrashIcon size={16} weight={failed ? "fill" : "regular"} />
    </button>
  );
}
