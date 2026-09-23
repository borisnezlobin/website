export type ResumeStatus = "GENERATED" | "DECLINED" | "FAILED";

export type WorkingStage = "reading" | "researching" | "screening" | "choosing" | "typesetting";

export type ProgressEvent =
    | { stage: WorkingStage; detail?: string }
    | { stage: "done"; slug: string }
    | { stage: "declined" }
    | { stage: "failed"; message: string };

export type ResumeRequestInput = {
    query: string;
    slugHint?: string;
};

export type BulletRewrite = { id: string; text: string };

export type ResumePlan = {
    rankedBulletIds: string[];
    rewrites: BulletRewrite[];
    skillsOrder?: string[];
};

export type RenderedResume = {
    pdf: Uint8Array;
    pageSvgs: string[];
    bulletIds: string[];
    fill: number;
};

export type ResumeView = {
    slug: string;
    company: string | null;
    focus: string;
    pdfUrl: string;
    pageSvgUrls: string[];
    tailoredBulletIds: string[];
    createdAt: string;
};

export type AdminResumeRow = {
    id: string;
    createdAt: string;
    query: string;
    jobUrl: string | null;
    slug: string | null;
    company: string | null;
    status: ResumeStatus;
    declineReason: string | null;
    provider: string | null;
    model: string | null;
    latencyMs: number | null;
    pdfUrl: string | null;
};

export type AdminResumeDetail = AdminResumeRow & {
    focus: string | null;
    plan: unknown;
    research: unknown;
};

export const STANDARD_SLUG = "standard";
