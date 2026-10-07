"use client";

import { fieldLabelClasses } from "@/components/ui/text-field";
import { COVER_POSITIONS, type CoverPosition } from "@/lib/articles/cover";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

/** A small sketch of the article header: dark bars are the title, the striped box the cover. */
function PositionSketch({ position }: { position: CoverPosition }) {
  const title = <span className="block h-1.5 w-full bg-ink" />;
  const shortTitle = <span className="block h-1.5 w-2/3 bg-ink" />;
  const image = <span className="block h-7 w-full stripe-pattern" />;

  if (position === "beside") {
    return (
      <span aria-hidden="true" className="grid h-12 w-16 grid-cols-2 items-center gap-1.5">
        <span className="flex flex-col gap-1">
          {title}
          {shortTitle}
        </span>
        <span className="block h-9 stripe-pattern" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex h-12 w-16 flex-col justify-center gap-1">
      {position === "above" && image}
      {title}
      {shortTitle}
      {position === "below" && image}
    </span>
  );
}

interface CoverPositionFieldProps {
  value: CoverPosition;
  onChange: (position: CoverPosition) => void;
}

/** "Нүүр зургийн байрлал": over the title, under it, or beside it (stacked on phones). */
export function CoverPositionField({ value, onChange }: CoverPositionFieldProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cx(fieldLabelClasses, "mb-2")}>{t("admin.cover.position.label")}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {COVER_POSITIONS.map((position) => (
          <label
            key={position}
            className={cx(
              "flex min-h-11 cursor-pointer items-center gap-3 border px-3 py-2.5 text-[15px]",
              value === position ? "border-ink bg-white" : "border-line hover:border-ink",
            )}
          >
            <input
              type="radio"
              name="coverPosition"
              value={position}
              checked={value === position}
              onChange={() => onChange(position)}
              className="size-5 shrink-0 cursor-pointer accent-accent"
            />
            <span className="flex-1">{t(`admin.cover.position.${position}`)}</span>
            <PositionSketch position={position} />
          </label>
        ))}
      </div>
      {value === "beside" && (
        <p className="text-xs text-muted">{t("admin.cover.position.besideHint")}</p>
      )}
    </fieldset>
  );
}
