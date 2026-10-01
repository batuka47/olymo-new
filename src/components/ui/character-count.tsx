import { cx } from "@/lib/cx";

interface CharacterCountProps {
  value: string;
  /** Hard limit (turns red when passed) or a recommendation. */
  limit: number;
  label?: string;
}

export function CharacterCount({ value, limit, label }: CharacterCountProps) {
  const over = value.length > limit;

  return (
    <span className={cx("font-mono text-[11px]", over ? "text-danger" : "text-muted")}>
      {label && `${label}: `}
      {value.length} / {limit}
    </span>
  );
}
