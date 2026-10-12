"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";

interface ViewFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** A small labelled input inside a block (caption, credit, alt text, quote author). */
export function ViewField({ label, value, onChange, placeholder, className }: ViewFieldProps) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="font-mono text-[10px] tracking-label text-muted uppercase">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full border border-line bg-white px-2 font-sans text-sm text-ink not-italic focus:border-ink"
      />
    </div>
  );
}

/** A small button inside a block (layout choice, move, remove). */
export function ViewButton({
  label,
  onClick,
  pressed,
  className,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cx(
        "min-h-9 cursor-pointer border px-2.5 font-mono text-[11px] tracking-label uppercase",
        pressed ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink",
        className,
      )}
    >
      {label}
    </button>
  );
}
