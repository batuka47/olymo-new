import type { ComponentProps, ReactNode } from "react";
import { fieldLabelClasses, inputClasses } from "@/components/ui/text-field";
import { cx } from "@/lib/cx";

interface TextAreaFieldProps extends ComponentProps<"textarea"> {
  name: string;
  label: string;
  hint?: ReactNode;
}

export function TextAreaField({
  label,
  name,
  id = name,
  hint,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-describedby={hintId}
        className={cx(inputClasses, "min-h-24 py-3 leading-relaxed")}
        {...textareaProps}
      />
      {hint && (
        <div id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </div>
      )}
    </div>
  );
}
