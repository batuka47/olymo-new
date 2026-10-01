import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

interface CheckboxFieldProps extends Omit<ComponentProps<"input">, "type"> {
  label: string;
}

export function CheckboxField({ label, className, ...inputProps }: CheckboxFieldProps) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3 text-[15px]", className)}>
      <input
        type="checkbox"
        className="size-5 shrink-0 cursor-pointer accent-accent"
        {...inputProps}
      />
      {label}
    </label>
  );
}
