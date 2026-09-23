import { CheckCircleIcon, ProhibitIcon, WarningOctagonIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ResumeStatus } from "@/app/lib/resume/types";
import { StatusBadge, type StatusTone } from "../components/status-badge";

type StatusPresentation = { label: string; tone: StatusTone; icon: Icon };

export const RESUME_STATUSES: ResumeStatus[] = ["GENERATED", "DECLINED", "FAILED"];

export const RESUME_STATUS_PRESENTATION: Record<ResumeStatus, StatusPresentation> = {
  GENERATED: { label: "Generated", tone: "positive", icon: CheckCircleIcon },
  DECLINED: { label: "Declined", tone: "caution", icon: ProhibitIcon },
  FAILED: { label: "Failed", tone: "critical", icon: WarningOctagonIcon },
};

export function ResumeStatusBadge({ status }: { status: ResumeStatus }) {
  const presentation = RESUME_STATUS_PRESENTATION[status];
  return <StatusBadge tone={presentation.tone} icon={presentation.icon} label={presentation.label} />;
}
