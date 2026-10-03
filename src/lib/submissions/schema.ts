import { z } from "zod";
import { needsOrganization, submissionKinds } from "@/config/submissions";
import { t } from "@/lib/i18n";
import { isHttpUrl } from "@/lib/url";

// One schema for the browser (inline errors before sending) and the server action (the check
// that counts). Messages come from messages/mn.json.

/**
 * A Mongolian number: 8 digits starting 5–9, optionally after +976 / 976, with spaces or dashes
 * anywhere between the groups: "9911 2233", "+976 9911-2233".
 */
export const PHONE_PATTERN = /^(?:\+?976)?[\s-]*([5-9]\d{3})[\s-]*(\d{4})$/;

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

const tooLong = () => t("submissions.errors.tooLong");

/** Trimmed; an empty field becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .transform((value) => value || null);

const phone = z
  .string()
  .trim()
  .transform((value, context) => {
    if (value === "") {
      return null;
    }
    const match = PHONE_PATTERN.exec(value);
    if (!match) {
      context.addIssue({ code: "custom", message: t("submissions.errors.phone") });
      return z.NEVER;
    }
    return `+976${match[1]}${match[2]}`;
  });

const email = z
  .string()
  .trim()
  .max(254, { error: tooLong })
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    error: () => t("submissions.errors.email"),
  })
  .transform((value) => value || null);

export const submissionSchema = z
  .object({
    kind: z.enum(submissionKinds),
    firstName: z
      .string()
      .trim()
      .min(1, { error: () => t("submissions.errors.firstName") })
      .max(100, { error: tooLong }),
    lastName: optionalText(100),
    phone,
    email,
    organization: optionalText(200),
    title: optionalText(200),
    filesUrl: optionalText(500).refine((value) => value === null || isHttpUrl(value), {
      error: () => t("submissions.errors.filesUrl"),
    }),
    message: z
      .string()
      .trim()
      .min(MESSAGE_MIN, { error: () => t("submissions.errors.messageShort", { min: MESSAGE_MIN }) })
      .max(MESSAGE_MAX, { error: () => t("submissions.errors.messageLong", { max: MESSAGE_MAX }) }),
  })
  .superRefine((values, context) => {
    if (values.phone === null && values.email === null) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: t("submissions.errors.contact"),
      });
    }
    if (needsOrganization(values.kind) && values.organization === null) {
      context.addIssue({
        code: "custom",
        path: ["organization"],
        message: t("submissions.errors.organization"),
      });
    }
    if (values.kind === "news" && values.title === null) {
      context.addIssue({ code: "custom", path: ["title"], message: t("submissions.errors.title") });
    }
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionValues = z.output<typeof submissionSchema>;
export type SubmissionField = Exclude<keyof SubmissionInput, "kind">;

export const submissionFields = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "organization",
  "title",
  "filesUrl",
  "message",
] as const satisfies readonly SubmissionField[];

export type FieldErrors = Partial<Record<SubmissionField, string>>;

/** The form's text fields from FormData; missing ones read as "". */
export function submissionInput(kind: string, formData: FormData): SubmissionInput {
  const text = (name: SubmissionField) => String(formData.get(name) ?? "");
  return {
    kind: kind as SubmissionInput["kind"],
    firstName: text("firstName"),
    lastName: text("lastName"),
    phone: text("phone"),
    email: text("email"),
    organization: text("organization"),
    title: text("title"),
    filesUrl: text("filesUrl"),
    message: text("message"),
  };
}

function isSubmissionField(value: unknown): value is SubmissionField {
  return (submissionFields as readonly unknown[]).includes(value);
}

/** The first message for each field, for inline errors. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (isSubmissionField(field) && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Hidden from people (off-screen, no tab stop, no autofill); bots fill in every field. */
export const HONEYPOT_FIELD = "website";

/** Milliseconds from the form appearing to sending, measured in the browser (no clock skew). */
export const FILL_TIME_FIELD = "fillTime";
export const MIN_FILL_MS = 3000;

export type SubmissionState =
  | { status: "idle" }
  | { status: "error"; message: string; errors: FieldErrors }
  | { status: "sent" };
