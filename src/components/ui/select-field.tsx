import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

interface SelectFieldProps extends ComponentProps<"select"> {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  hideLabel?: boolean;
}

export function SelectField({
  label,
  name,
  id = name,
  options,
  hideLabel = false,
  className,
  ...selectProps
}: SelectFieldProps) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className={cx(
          "font-mono text-[11px] tracking-label text-muted uppercase",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="h-12 cursor-pointer border border-ink bg-white px-3 text-base text-ink"
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
