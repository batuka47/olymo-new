import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type TagVariant = "outline" | "ink" | "lime" | "accent";

const variantClasses: Record<TagVariant, string> = {
  outline: "border-ink text-ink",
  ink: "border-ink bg-ink text-paper",
  lime: "border-lime bg-lime text-ink",
  accent: "border-accent bg-accent text-white",
};

interface TagProps extends ComponentProps<"span"> {
  variant?: TagVariant;
}

export function Tag({ variant = "outline", className, ...props }: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.75 font-mono text-[11px] leading-4 tracking-label uppercase",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
