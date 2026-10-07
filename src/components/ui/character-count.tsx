import { cx } from "@/lib/cx";

interface CharacterCountProps {
  value: string;
  /** Hard limit (turns red when passed) or a recommendation. */
  limit: number;
  /** Shown as a range ("34 / 50–200") when the text also has a minimum length. */
  min?: number;
  label?: string;
}

export function CharacterCount({ value, limit, min, label }: CharacterCountProps) {
  const over = value.length > limit;

  return (
    <span className={cx("font-mono text-[11px]", over ? "text-danger" : "text-muted")}>
      {label && `${label}: `}
      {value.length} / {min === undefined ? limit : `${min}–${limit}`}
    </span>
  );
}
