import "server-only";
import { adminRoutes } from "@/config/admin";
import { siteConfig } from "@/config/site";
import { submissionKindLabelKeys } from "@/config/submissions";
import { sendEmail } from "@/lib/email/resend";
import { t, type MessageKey } from "@/lib/i18n";
import type { SubmissionValues } from "@/lib/submissions/schema";

const lines: [MessageKey, (values: SubmissionValues) => string | null][] = [
  ["submissions.fields.firstName", (values) => values.firstName],
  ["submissions.fields.lastName", (values) => values.lastName],
  ["submissions.fields.organization", (values) => values.organization],
  ["submissions.fields.phone", (values) => values.phone],
  ["submissions.fields.email", (values) => values.email],
  ["submissions.fields.title", (values) => values.title],
  ["submissions.fields.filesUrl", (values) => values.filesUrl],
];

function emailText(id: string, values: SubmissionValues): string {
  const fields = lines
    .map(([labelKey, value]) => [t(labelKey), value(values)] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  return [
    t(submissionKindLabelKeys[values.kind]),
    "",
    ...fields,
    "",
    `${t("submissions.fields.message")}:`,
    values.message,
    "",
    `${t("submissions.email.open")}: ${siteConfig.url}${adminRoutes.inbox}?id=${id}`,
  ].join("\n");
}

/**
 * Tells the team about a new submission (NOTIFY_EMAIL). Runs after the visitor has their answer;
 * a failure is logged only, as the submission is already saved and waits in the inbox.
 */
export async function notifyNewSubmission(id: string, values: SubmissionValues): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) {
    console.error(`NOTIFY_EMAIL is not set: submission ${id} is saved, but nobody was emailed.`);
    return;
  }
  const name = [values.firstName, values.lastName].filter(Boolean).join(" ");
  try {
    await sendEmail({
      to,
      subject: t("submissions.email.subject", {
        kind: t(submissionKindLabelKeys[values.kind]),
        name,
      }),
      text: emailText(id, values),
      replyTo: values.email ?? undefined,
    });
  } catch (error) {
    console.error(`The email about submission ${id} failed (the submission is saved):`, error);
  }
}
