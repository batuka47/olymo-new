"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { needsOrganization, type SubmissionKind } from "@/config/submissions";
import { TURNSTILE_FIELD } from "@/config/turnstile";
import { t } from "@/lib/i18n";
import { submitForm } from "@/lib/submissions/actions";
import {
  FILL_TIME_FIELD,
  fieldErrors,
  HONEYPOT_FIELD,
  MESSAGE_MAX,
  submissionFields,
  submissionInput,
  submissionSchema,
  type FieldErrors,
  type SubmissionField,
  type SubmissionState,
} from "@/lib/submissions/schema";

const initialState: SubmissionState = { status: "idle" };

interface SubmissionFormProps {
  kind: SubmissionKind;
  title: string;
}

function label(field: SubmissionField, required: boolean): string {
  const text = t(`submissions.fields.${field}`);
  return required ? `${text} *` : text;
}

function firstInvalid(errors: FieldErrors): SubmissionField | undefined {
  return submissionFields.find((field) => errors[field]);
}

function focusField(form: HTMLFormElement | null, field: SubmissionField | undefined) {
  if (field) {
    form?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }
}

/**
 * The contact, advertising, partnership and news forms. Checked in the browser with the same
 * schema as on the server; sent with onSubmit rather than a form action, so React never resets
 * what the person typed when the server answers with an error.
 */
export function SubmissionForm({ kind, title }: SubmissionFormProps) {
  const [state, dispatch, pending] = useActionState(submitForm, initialState);
  // The browser's own check, until the next send; then the server's answer shows instead.
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const shownAt = useRef(0);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const serverErrors = state.status === "error" ? state.errors : {};
  const errors: FieldErrors = Object.fromEntries(
    Object.entries(clientErrors ?? serverErrors).filter(([field]) => !edited.has(field)),
  );
  const generalMessage = notice ?? (state.status === "error" ? state.message : undefined);

  // A server answer with field errors moves focus to the first one; "sent" to the thank-you note.
  useEffect(() => {
    if (state.status === "error") {
      focusField(formRef.current, firstInvalid(state.errors));
    } else if (state.status === "sent") {
      sentRef.current?.focus();
    }
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setEdited(new Set());

    const checked = submissionSchema.safeParse(submissionInput(kind, formData));
    if (!checked.success) {
      const errorsFound = fieldErrors(checked.error);
      setClientErrors(errorsFound);
      setNotice(t("submissions.errors.check"));
      focusField(formRef.current, firstInvalid(errorsFound));
      return;
    }
    if (!formData.get(TURNSTILE_FIELD)) {
      setClientErrors({});
      setNotice(t("spam.waitForCheck"));
      return;
    }

    setClientErrors(null);
    setNotice(null);
    formData.set("kind", kind);
    formData.set(FILL_TIME_FIELD, String(Date.now() - shownAt.current));
    startTransition(() => dispatch(formData));
  }

  if (state.status === "sent") {
    return (
      <section
        aria-labelledby="submission-sent-title"
        className="border border-ink bg-white p-6 lg:p-8"
      >
        <div ref={sentRef} tabIndex={-1} role="status" className="flex flex-col gap-3 outline-none">
          <h2 id="submission-sent-title" className="font-display text-xl font-bold lg:text-2xl">
            {t("submissions.sent.title")}
          </h2>
          <p className="text-[17px] leading-relaxed text-graphite">{t("submissions.sent.text")}</p>
        </div>
      </section>
    );
  }

  const organizationRequired = needsOrganization(kind);
  const fieldProps = (field: SubmissionField) => ({ name: field, error: errors[field] });

  return (
    <section
      aria-labelledby="submission-form-title"
      className="flex flex-col gap-6 border border-ink bg-white p-5 lg:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2 id="submission-form-title" className="font-display text-xl font-bold lg:text-2xl">
          {title}
        </h2>
        <p className="text-sm text-muted">{t("submissions.requiredNote")}</p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onInput={(event) => {
          const { name } = event.target as HTMLInputElement;
          setEdited((current) => new Set(current).add(name));
        }}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={label("firstName", true)}
            autoComplete="given-name"
            maxLength={100}
            required
            {...fieldProps("firstName")}
          />
          <TextField
            label={label("lastName", false)}
            autoComplete="family-name"
            maxLength={100}
            {...fieldProps("lastName")}
          />
          <TextField
            label={label("phone", false)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="9911 2233"
            maxLength={20}
            {...fieldProps("phone")}
          />
          <TextField
            label={label("email", false)}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            {...fieldProps("email")}
          />
          <p className="-mt-2 text-xs text-muted sm:col-span-2">{t("submissions.contactHint")}</p>
        </div>

        <TextField
          label={label("organization", organizationRequired)}
          autoComplete="organization"
          maxLength={200}
          required={organizationRequired}
          {...fieldProps("organization")}
        />

        {kind === "news" && (
          <>
            <TextField
              label={label("title", true)}
              maxLength={200}
              required
              {...fieldProps("title")}
            />
            <TextField
              label={label("filesUrl", false)}
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={500}
              hint={t("submissions.filesUrlHint")}
              {...fieldProps("filesUrl")}
            />
          </>
        )}

        <TextAreaField
          label={label("message", true)}
          rows={6}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          hint={
            <span className="flex flex-wrap justify-between gap-2">
              {t(`submissions.messageHints.${kind}`)}
              <CharacterCount value={message} limit={MESSAGE_MAX} />
            </span>
          }
          {...fieldProps("message")}
        />

        {/* People never see or reach this field; a value in it marks a bot. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor={HONEYPOT_FIELD}>{t("submissions.honeypot")}</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Turnstile resetKey={state} />

        <FormMessage state={{ error: generalMessage }} />

        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending && <Spinner />}
          {pending ? t("submissions.sending") : t("submissions.send")}
        </Button>
      </form>
    </section>
  );
}
