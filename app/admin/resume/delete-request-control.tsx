"use client";

import ConfirmDelete from "./confirm-delete";
import { useResumeDeletes } from "./use-resume-requests";

export default function DeleteRequestControl({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { deleteRequest } = useResumeDeletes();

  return (
    <ConfirmDelete
      idleLabel="Delete request"
      question="Delete this request and anything it generated?"
      confirmLabel="Delete"
      keepLabel="Keep"
      errorPrefix="Couldn't delete the request."
      onConfirm={() => deleteRequest(id)}
      onDeleted={onDeleted}
      iconOnly
    />
  );
}
