"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Drawer } from "@/components/admin/drawer";
import { Button } from "@/components/ui/button";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { Spinner } from "@/components/ui/spinner";
import { TextAreaField } from "@/components/ui/textarea-field";
import {
  NOTE_MAX,
  submissionKindLabelKeys,
  submissionStatuses,
  submissionStatusLabelKeys,
  type SubmissionKind,
  type SubmissionStatus,
} from "@/config/submissions";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import type { Submission } from "@/lib/submissions/queries";
import { updateSubmission } from "./actions";

interface SubmissionDrawerProps {
  submission: Submission;
  /** The inbox address without ?id=, where closing goes. */
  closeHref: string;
}

const linkClasses =
  "inline-flex min-h-11 items-center break-all text-accent underline underline-offset-4";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-line py-3">
      <dt className="font-mono text-[11px] tracking-label text-muted uppercase">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  );
}

/** One submission with every field, tel:/mailto: links, and the status and note to change. */
export function SubmissionDrawer({ submission, closeHref }: SubmissionDrawerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(submission.status as SubmissionStatus);
  const [note, setNote] = useState(submission.admin_note ?? "");
  const [result, setResult] = useState<FormState>({});
  const [saving, startSaving] = useTransition();
  const name = [submission.first_name, submission.last_name].filter(Boolean).join(" ");
  const kind = submission.kind as SubmissionKind;

  function save() {
    startSaving(async () => {
      const response = await updateSubmission({ id: submission.id, status, adminNote: note });
      setResult(response.ok ? { success: t("admin.inbox.saved") } : { error: response.error });
      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Drawer title={name} onClose={() => router.push(closeHref, { scroll: false })}>
      <p className="mb-2 font-mono text-xs tracking-label text-muted uppercase">
        {t(submissionKindLabelKeys[kind])} · {formatDateTime(submission.created_at)}
      </p>
      <dl className="border-b border-line">
        {submission.organization && (
          <Detail label={t("submissions.fields.organization")}>{submission.organization}</Detail>
        )}
        {submission.phone && (
          <Detail label={t("submissions.fields.phone")}>
            <a href={`tel:${submission.phone}`} className={linkClasses}>
              {submission.phone}
            </a>
          </Detail>
        )}
        {submission.email && (
          <Detail label={t("submissions.fields.email")}>
            <a href={`mailto:${submission.email}`} className={linkClasses}>
              {submission.email}
            </a>
          </Detail>
        )}
        {submission.title && (
          <Detail label={t("submissions.fields.title")}>{submission.title}</Detail>
        )}
        {submission.files_url && (
          <Detail label={t("submissions.fields.filesUrl")}>
            {/* Typed by a visitor: no referrer, no ranking credit. */}
            <a
              href={submission.files_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={linkClasses}
            >
              {submission.files_url}
            </a>
          </Detail>
        )}
        <Detail label={t("submissions.fields.message")}>
          <p className="leading-relaxed whitespace-pre-wrap">{submission.message}</p>
        </Detail>
      </dl>

      <div className="mt-6 flex flex-col gap-5">
        <SelectField
          label={t("admin.inbox.status")}
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as SubmissionStatus)}
          options={submissionStatuses.map((value) => ({
            value,
            label: t(submissionStatusLabelKeys[value]),
          }))}
        />
        <TextAreaField
          label={t("admin.inbox.note")}
          name="adminNote"
          rows={4}
          maxLength={NOTE_MAX}
          value={note}
          hint={t("admin.inbox.noteHint")}
          onChange={(event) => setNote(event.target.value)}
        />
        <FormMessage state={result} />
        <Button onClick={save} disabled={saving} className="self-start">
          {saving && <Spinner />}
          {saving ? t("admin.inbox.saving") : t("admin.inbox.save")}
        </Button>
      </div>
    </Drawer>
  );
}
