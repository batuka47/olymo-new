"use client";

import Link from "next/link";
import { useCallback, useId, useState, useTransition, type FormEvent } from "react";
import { SlugField } from "@/components/admin/editor/slug-field";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { adminRoutes } from "@/config/admin";
import { EVENTS_CATEGORY_SLUG, HOME_CATEGORY_LIMIT } from "@/config/categories";
import { CATEGORY_LIMITS, type CategoryFormValues } from "@/lib/categories/schema";
import { t, type MessageKey } from "@/lib/i18n";
import { slugFromTitle } from "@/lib/slug";
import { checkCategorySlug, saveCategory } from "./actions";

interface CategoryFormProps {
  /** null for a new category. */
  originalSlug: string | null;
  initialValues: CategoryFormValues;
  /** Articles listed in it: with any, its address (slug) stays as it is. */
  articleCount: number;
  /** Other categories ticked "Нүүрэнд харуулах"; at HOME_CATEGORY_LIMIT this one cannot be. */
  homeCategoriesTaken: number;
}

type Setting = "showInNav" | "isActive" | "hasOlympiadFields" | "showOnHome";

const settings: { key: Setting; label: MessageKey; hint: MessageKey }[] = [
  {
    key: "showInNav",
    label: "admin.categories.form.showInNav",
    hint: "admin.categories.form.showInNavHint",
  },
  {
    key: "isActive",
    label: "admin.categories.form.isActive",
    hint: "admin.categories.form.isActiveHint",
  },
  {
    key: "hasOlympiadFields",
    label: "admin.categories.form.hasOlympiadFields",
    hint: "admin.categories.form.hasOlympiadFieldsHint",
  },
  {
    key: "showOnHome",
    label: "admin.categories.form.showOnHome",
    hint: "admin.categories.form.showOnHomeHint",
  },
];

function SettingField({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const hintId = useId();
  return (
    <div>
      <CheckboxField
        label={label}
        checked={checked}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <p id={hintId} className="pl-8 text-xs leading-relaxed text-muted">
        {hint}
      </p>
    </div>
  );
}

export function CategoryForm({
  originalSlug,
  initialValues,
  articleCount,
  homeCategoriesTaken,
}: CategoryFormProps) {
  const [values, setValues] = useState(initialValues);
  const [slugEdited, setSlugEdited] = useState(originalSlug !== null);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();
  const isEvents = originalSlug === EVENTS_CATEGORY_SLUG;
  const slugLocked = isEvents || articleCount > 0;
  // Unticking stays possible; a fifth category cannot be ticked.
  const homeFull = homeCategoriesTaken >= HOME_CATEGORY_LIMIT && !values.showOnHome;
  const checkSlug = useCallback(
    (slug: string) => checkCategorySlug(slug, originalSlug),
    [originalSlug],
  );

  function update<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // The slug follows the name until it is typed by hand, and never once articles use it.
  function updateLabel(label: string) {
    setValues((current) => ({
      ...current,
      label,
      slug: slugEdited || slugLocked ? current.slug : slugFromTitle(label),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    startSaving(async () => {
      // On success the action opens the category list.
      const result = await saveCategory({ ...values, originalSlug });
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-2xl flex-col gap-6">
      <TextField
        label={`${t("admin.categories.form.label")} *`}
        name="label"
        value={values.label}
        maxLength={CATEGORY_LIMITS.label}
        required
        hint={t("admin.categories.form.labelHint")}
        onChange={(event) => updateLabel(event.target.value)}
      />

      {slugLocked ? (
        <TextField
          label={t("admin.slug.label")}
          name="slug"
          value={values.slug}
          readOnly
          hint={
            isEvents
              ? t("admin.categories.form.slugEvents")
              : t("admin.categories.form.slugLocked", { count: articleCount })
          }
        />
      ) : (
        <SlugField
          value={values.slug}
          onEdit={(slug) => {
            setSlugEdited(true);
            update("slug", slug);
          }}
          onRegenerate={() => {
            setSlugEdited(false);
            update("slug", slugFromTitle(values.label));
          }}
          checkAvailability={checkSlug}
          hint={t("admin.categories.form.slugHint")}
          regenerateLabel={t("admin.categories.form.slugRegenerate")}
        />
      )}

      <TextAreaField
        label={t("admin.categories.form.description")}
        name="description"
        value={values.description}
        rows={3}
        maxLength={CATEGORY_LIMITS.description}
        onChange={(event) => update("description", event.target.value)}
        hint={
          <span className="flex flex-wrap justify-between gap-2">
            {t("admin.categories.form.descriptionHint")}
            <CharacterCount value={values.description} limit={CATEGORY_LIMITS.description} />
          </span>
        }
      />

      <fieldset className="flex flex-col gap-3 border border-line p-5">
        {settings
          // The events section is not an article category: no olympiad fields or home tile there.
          .filter(
            (setting) =>
              !(isEvents && (setting.key === "hasOlympiadFields" || setting.key === "showOnHome")),
          )
          .map((setting) => {
            const full = setting.key === "showOnHome" && homeFull;
            return (
              <SettingField
                key={setting.key}
                label={t(setting.label)}
                hint={
                  full
                    ? t("admin.categories.form.showOnHomeFull", { limit: HOME_CATEGORY_LIMIT })
                    : t(setting.hint, { limit: HOME_CATEGORY_LIMIT })
                }
                checked={values[setting.key]}
                disabled={full}
                onChange={(checked) => update(setting.key, checked)}
              />
            );
          })}
      </fieldset>

      <FormMessage state={{ error }} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? t("admin.categories.form.saving") : t("admin.categories.form.save")}
        </Button>
        <Link href={adminRoutes.categories} className="text-sm underline underline-offset-4">
          ← {t("admin.categories.form.back")}
        </Link>
      </div>
    </form>
  );
}
