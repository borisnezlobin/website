"use client";

import ConfirmDelete from "./confirm-delete";
import { resumePath } from "./format";
import { useResumeDeletes } from "./use-resume-requests";

export default function DeleteSlugControl({ slug, onDeleted }: { slug: string; onDeleted: () => void }) {
  const { deleteSlug } = useResumeDeletes();

  return (
    <ConfirmDelete
      idleLabel="Delete slug"
      question={
        <>
          Delete <span className="font-mono">{resumePath(slug)}</span> and its PDF? The request stays logged.
        </>
      }
      confirmLabel="Delete for good"
      keepLabel="Keep slug"
      errorPrefix="Couldn't delete the slug."
      onConfirm={() => deleteSlug(slug)}
      onDeleted={onDeleted}
    />
  );
}
