import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type ButtonVariant = "accent" | "ink" | "outline" | "danger";
/** md 44 px, field 48 px (next to form inputs), lg 56 px. */
type ButtonSize = "md" | "field" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  accent: "bg-accent text-white hover:bg-ink",
  ink: "bg-ink text-paper hover:bg-accent",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  danger: "bg-danger text-white hover:bg-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-4.5 text-xs",
  field: "h-12 px-5 text-xs",
  lg: "h-14 px-6.5 text-[13px]",
};

export function buttonClasses({ variant = "accent", size = "md", className }: ButtonStyleProps) {
  return cx(
    "inline-flex cursor-pointer items-center justify-center gap-2 font-mono tracking-label whitespace-nowrap uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type LinkButtonProps = ButtonStyleProps & Omit<ComponentProps<typeof Link>, "className">;

type NativeButtonProps = ButtonStyleProps &
  Omit<ComponentProps<"button">, "className"> & { href?: undefined };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, className, ...linkProps } = props;
    return <Link className={buttonClasses({ variant, size, className })} {...linkProps} />;
  }

  const { variant, size, className, type = "button", ...buttonProps } = props;
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...buttonProps} />
  );
}
