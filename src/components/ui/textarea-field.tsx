import type { ComponentProps, ReactNode } from "react";
import {
  describedBy,
  FieldText,
  fieldLabelClasses,
  inputClasses,
  invalidInputClasses,
} from "@/components/ui/text-field";
import { cx } from "@/lib/cx";

interface TextAreaFieldProps extends ComponentProps<"textarea"> {
  name: string;
  label: string;
  hint?: ReactNode;
  /** Shown in red under the textarea, which is marked aria-invalid. */
  error?: string;
}

export function TextAreaField({
  label,
  name,
  id = name,
  hint,
  error,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-describedby={describedBy({ id, hint, error })}
        aria-invalid={error ? true : undefined}
        className={cx(inputClasses, invalidInputClasses, "min-h-24 py-3 leading-relaxed")}
        {...textareaProps}
      />
      <FieldText id={id} hint={hint} error={error} />
    </div>
  );
}
