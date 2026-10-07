"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { t } from "@/lib/i18n";
import { SLUG_PATTERN } from "@/lib/slug";

/** Delay after the last keystroke before asking the server whether the slug is free. */
const CHECK_DELAY_MS = 400;

interface SlugFieldProps {
  value: string;
  /** Typed by hand: the slug stops following the title. */
  onEdit: (slug: string) => void;
  /** "Гарчгаас дахин үүсгэх": follow the title again. */
  onRegenerate: () => void;
  /** true = free, false = taken, null = not a valid slug. */
  checkAvailability: (slug: string) => Promise<boolean | null>;
  /** Still made from the title: a taken link gets a number on save instead of being an error. */
  numbersWhenTaken?: boolean;
  /** Where the slug comes from, for fields that follow something other than a title. */
  hint?: string;
  regenerateLabel?: string;
}

function SlugStatus({
  slug,
  check,
  numbersWhenTaken,
  hint,
}: {
  slug: string;
  check: { slug: string; available: boolean | null } | null;
  numbersWhenTaken: boolean;
  hint: string;
}) {
  if (!slug) {
    return <p className="text-xs text-muted">{hint}</p>;
  }
  if (!SLUG_PATTERN.test(slug)) {
    return <p className="text-xs text-danger">{t("admin.slug.invalid")}</p>;
  }
  if (check?.slug !== slug) {
    return <p className="text-xs text-muted">{t("admin.slug.checking")}</p>;
  }
  if (check.available) {
    return <p className="text-xs text-muted">✓ {t("admin.slug.available")}</p>;
  }
  return numbersWhenTaken ? (
    <p className="text-xs text-muted">{t("admin.slug.takenAuto")}</p>
  ) : (
    <p className="text-xs text-danger">{t("admin.slug.taken")}</p>
  );
}

/** The public address part, with a live "is it free?" check. */
export function SlugField({
  value,
  onEdit,
  onRegenerate,
  checkAvailability,
  numbersWhenTaken = false,
  hint = t("admin.slug.hint"),
  regenerateLabel = t("admin.slug.regenerate"),
}: SlugFieldProps) {
  const [check, setCheck] = useState<{ slug: string; available: boolean | null } | null>(null);

  useEffect(() => {
    if (!SLUG_PATTERN.test(value)) {
      return;
    }
    const timer = setTimeout(async () => {
      setCheck({ slug: value, available: await checkAvailability(value) });
    }, CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [value, checkAvailability]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <TextField
          label={t("admin.slug.label")}
          name="slug"
          value={value}
          maxLength={120}
          className="min-w-60 flex-1"
          onChange={(event) => onEdit(event.target.value.toLowerCase())}
        />
        <Button variant="outline" size="field" onClick={onRegenerate}>
          {regenerateLabel}
        </Button>
      </div>
      <SlugStatus slug={value} check={check} numbersWhenTaken={numbersWhenTaken} hint={hint} />
    </div>
  );
}
