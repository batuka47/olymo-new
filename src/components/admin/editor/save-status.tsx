"use client";

import { cx } from "@/lib/cx";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";

export type SavingKind = "manual" | "auto" | null;

export interface LastSave {
  at: string;
  auto: boolean;
}

interface SaveStatusProps {
  saving: SavingKind;
  lastSaved: LastSave | null;
  dirty: boolean;
}

/** "Хадгалж байна…", "Хадгалаагүй өөрчлөлт" or when the last save happened. */
export function SaveStatus({ saving, lastSaved, dirty }: SaveStatusProps) {
  let text = "";
  if (saving) {
    text = t("admin.publish.saving");
  } else if (dirty) {
    text = t("admin.publish.unsaved");
  } else if (lastSaved) {
    const label = lastSaved.auto ? t("admin.publish.autosaved") : t("admin.publish.saved");
    text = `${label} · ${formatDateTime(lastSaved.at)}`;
  }

  return (
    <span
      role="status"
      className={cx("font-mono text-[11px]", dirty && !saving ? "text-danger" : "text-muted")}
    >
      {text}
    </span>
  );
}
