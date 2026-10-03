import type { MessageKey } from "@/lib/i18n";

/** The four forms; stored in submissions.kind. */
export const submissionKinds = ["contact", "ad", "partner", "news"] as const;
export type SubmissionKind = (typeof submissionKinds)[number];

export const submissionStatuses = ["new", "in_progress", "done", "spam"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export function isSubmissionKind(value: string): value is SubmissionKind {
  return (submissionKinds as readonly string[]).includes(value);
}

export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return (submissionStatuses as readonly string[]).includes(value);
}

export const submissionKindLabelKeys: Record<SubmissionKind, MessageKey> = {
  contact: "submissions.kinds.contact",
  ad: "submissions.kinds.ad",
  partner: "submissions.kinds.partner",
  news: "submissions.kinds.news",
};

export const submissionStatusLabelKeys: Record<SubmissionStatus, MessageKey> = {
  new: "submissions.statuses.new",
  in_progress: "submissions.statuses.in_progress",
  done: "submissions.statuses.done",
  spam: "submissions.statuses.spam",
};

/** Requests from organizations: the organization field is required. */
export function needsOrganization(kind: SubmissionKind): boolean {
  return kind === "ad" || kind === "partner";
}

/** The admins' internal note on a submission. */
export const NOTE_MAX = 2000;
