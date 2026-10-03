"use server";

import { after } from "next/server";
import { t } from "@/lib/i18n";
import { clientIp, hashIp } from "@/lib/spam/ip";
import { canSubmitForm } from "@/lib/spam/rate-limit";
import { verifyTurnstile } from "@/lib/spam/turnstile";
import { notifyNewSubmission } from "@/lib/submissions/notify";
import {
  FILL_TIME_FIELD,
  fieldErrors,
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  submissionInput,
  submissionSchema,
  type SubmissionState,
  type SubmissionValues,
} from "@/lib/submissions/schema";
import { createAdminClient } from "@/lib/supabase/admin";

function failure(message: string): SubmissionState {
  return { status: "error", message, errors: {} };
}

/** Readers cannot write to submissions (RLS), so the service role inserts. */
async function saveSubmission(values: SubmissionValues, ipHash: string): Promise<string> {
  const isNews = values.kind === "news";
  const { data, error } = await createAdminClient()
    .from("submissions")
    .insert({
      kind: values.kind,
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      email: values.email,
      organization: values.organization,
      title: isNews ? values.title : null,
      files_url: isNews ? values.filesUrl : null,
      message: values.message,
      ip_hash: ipHash,
    })
    .select("id")
    .single();
  if (error) {
    throw error;
  }
  return data.id;
}

/** The four public forms (SubmissionForm). Checks the cheap things first, the network last. */
export async function submitForm(
  _previous: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  // Only bots fill the honeypot. They are told it worked, so they have nothing to adjust.
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") {
    return { status: "sent" };
  }
  if (!(Number(formData.get(FILL_TIME_FIELD)) >= MIN_FILL_MS)) {
    return failure(t("submissions.errors.tooFast"));
  }
  const parsed = submissionSchema.safeParse(
    submissionInput(String(formData.get("kind") ?? ""), formData),
  );
  if (!parsed.success) {
    return {
      status: "error",
      message: t("submissions.errors.check"),
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    const ip = await clientIp();
    if (!(await verifyTurnstile(formData, ip))) {
      return failure(t("spam.turnstileFailed"));
    }
    const ipHash = hashIp(ip);
    if (!(await canSubmitForm(ipHash))) {
      return failure(t("submissions.errors.tooMany"));
    }
    const id = await saveSubmission(parsed.data, ipHash);
    // The visitor gets the answer now; the email goes out afterwards.
    after(() => notifyNewSubmission(id, parsed.data));
    return { status: "sent" };
  } catch (error) {
    console.error("Saving a form submission failed:", error);
    return failure(t("submissions.errors.failed"));
  }
}
