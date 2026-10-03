"use client";

import { EditorPanel } from "@/components/admin/editor/editor-panel";
import { TextField } from "@/components/ui/text-field";
import { toUlaanbaatarInputValue } from "@/lib/dates";
import { t } from "@/lib/i18n";
import type { PublishMode } from "@/lib/publishing";

interface PublishPanelProps {
  mode: PublishMode;
  scheduleAt: string;
  note: string;
  onModeChange: (mode: PublishMode) => void;
  onScheduleAtChange: (value: string) => void;
}

function RadioOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
      <input
        type="radio"
        name="publishMode"
        checked={checked}
        onChange={onChange}
        className="size-5 cursor-pointer accent-accent"
      />
      {label}
    </label>
  );
}

/** "Одоо нийтлэх" or "Огноо товлох" with a date and time in Ulaanbaatar. */
export function PublishPanel({
  mode,
  scheduleAt,
  note,
  onModeChange,
  onScheduleAtChange,
}: PublishPanelProps) {
  return (
    <EditorPanel title={t("admin.publish.title")}>
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">{t("admin.publish.title")}</legend>
        <RadioOption
          label={t("admin.publish.now")}
          checked={mode === "now"}
          onChange={() => onModeChange("now")}
        />
        <RadioOption
          label={t("admin.publish.schedule")}
          checked={mode === "schedule"}
          onChange={() => onModeChange("schedule")}
        />
      </fieldset>
      {mode === "schedule" && (
        <TextField
          label={t("admin.publish.scheduleAt")}
          name="scheduleAt"
          type="datetime-local"
          value={scheduleAt}
          min={toUlaanbaatarInputValue(new Date())}
          onChange={(event) => onScheduleAtChange(event.target.value)}
          className="mt-3"
        />
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted">{note}</p>
    </EditorPanel>
  );
}
