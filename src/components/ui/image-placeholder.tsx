import { cx } from "@/lib/cx";

interface ImagePlaceholderProps {
  label?: string;
  className?: string;
}

export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div aria-hidden="true" className={cx("flex items-end stripe-pattern p-3", className)}>
      {label && <span className="font-mono text-[10px] tracking-[0.08em] text-muted">{label}</span>}
    </div>
  );
}
