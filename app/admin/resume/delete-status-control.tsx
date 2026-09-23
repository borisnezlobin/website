"use client";

import type { ResumeStatus } from "@/app/lib/resume/types";
import ConfirmDelete from "./confirm-delete";
import { RESUME_STATUS_PRESENTATION } from "./resume-status";
import { useResumeDeletes } from "./use-resume-requests";

function describeGroup(status: ResumeStatus, count: number): string {
  const noun = RESUME_STATUS_PRESENTATION[status].label.toLowerCase();
  return `${count} ${noun} request${count === 1 ? "" : "s"}`;
}

export default function DeleteStatusControl({
  status,
  count,
  onDeleted,
}: {
  status: ResumeStatus;
  count: number;
  onDeleted: () => void;
}) {
  const { deleteByStatus } = useResumeDeletes();
  const group = describeGroup(status, count);

  return (
    <ConfirmDelete
      idleLabel={`Delete ${group}`}
      question={`Delete ${group}? This cannot be undone.`}
      confirmLabel={`Delete ${group}`}
      keepLabel="Keep them"
      errorPrefix="Couldn't delete those requests."
      onConfirm={() => deleteByStatus(status)}
      onDeleted={onDeleted}
    />
  );
}
