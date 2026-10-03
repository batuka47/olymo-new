import { cx } from "@/lib/cx";

/** A small turning square for buttons while they wait; the button's text says what is happening. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block size-3.5 animate-spin border-2 border-current border-r-transparent motion-reduce:animate-none",
        className,
      )}
    />
  );
}
