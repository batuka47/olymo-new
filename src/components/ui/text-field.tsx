import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

interface TextFieldProps extends ComponentProps<"input"> {
  name: string;
  label: string;
}

export function TextField({ label, name, id = name, className, ...inputProps }: TextFieldProps) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-mono text-[11px] tracking-label text-muted uppercase">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="h-12 border border-ink bg-white px-4 text-base text-ink"
        {...inputProps}
      />
    </div>
  );
}
