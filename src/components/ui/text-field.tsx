import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

export const fieldLabelClasses = "font-mono text-[11px] tracking-label text-muted uppercase";
export const inputClasses = "w-full border border-ink bg-white px-4 text-base text-ink";
/** Inputs with an error get a red border (aria-invalid set by the field). */
export const invalidInputClasses = "aria-invalid:border-danger aria-invalid:outline-danger";

interface FieldTextProps {
  id: string;
  hint?: ReactNode;
  error?: string;
}

/** Ids for aria-describedby: the error first, so screen readers announce it before the hint. */
export function describedBy({ id, hint, error }: FieldTextProps): string | undefined {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/**
 * The error and help text under an input; the error in red. The error is an alert, so screen
 * readers announce it when it appears, wherever focus is (a comment refused by the server).
 */
export function FieldText({ id, hint, error }: FieldTextProps) {
  return (
    <>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <div id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </div>
      )}
    </>
  );
}

interface TextFieldProps extends ComponentProps<"input"> {
  name: string;
  label: string;
  /** Help text or a character counter under the input; linked with aria-describedby. */
  hint?: ReactNode;
  /** Shown in red under the input, which is marked aria-invalid. */
  error?: string;
}

export function TextField({
  label,
  name,
  id = name,
  hint,
  error,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-describedby={describedBy({ id, hint, error })}
        aria-invalid={error ? true : undefined}
        className={cx(inputClasses, invalidInputClasses, "h-12")}
        {...inputProps}
      />
      <FieldText id={id} hint={hint} error={error} />
    </div>
  );
}
