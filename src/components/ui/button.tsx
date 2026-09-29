import type { ComponentProps } from "react";

type ButtonVariant = "accent" | "ink" | "outline";

const baseClasses =
  "inline-flex h-12 cursor-pointer items-center justify-center px-[22px] font-mono text-xs tracking-label uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variantClasses: Record<ButtonVariant, string> = {
  accent: "bg-accent text-white hover:bg-ink",
  ink: "bg-ink text-paper hover:bg-accent",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "accent", type = "button", className, ...props }: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], className].filter(Boolean).join(" ");

  return <button type={type} className={classes} {...props} />;
}
