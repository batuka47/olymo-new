"use client";

import { useId } from "react";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { fieldLabelClasses } from "@/components/ui/text-field";
import { articleCategoryChoices, type Category } from "@/config/categories";
import { t } from "@/lib/i18n";

interface ArticleCategoriesFieldProps {
  /** Every category from the database (lib/categories/queries.ts). */
  categories: Category[];
  main: string;
  secondary: string[];
  onChange: (categories: { main: string; secondary: string[] }) => void;
}

/**
 * The main category (it is in the article's address) and "Хамаарах категориуд", the others whose
 * lists show the article too. Hidden categories are offered only where already chosen.
 */
export function ArticleCategoriesField({
  categories,
  main,
  secondary,
  onChange,
}: ArticleCategoriesFieldProps) {
  const hintId = useId();
  const choices = articleCategoryChoices(categories, [main, ...secondary]);
  const label = (category: Category) =>
    category.is_active
      ? category.label
      : t("admin.articles.editor.hiddenCategory", { label: category.label });

  function changeMain(slug: string) {
    onChange({ main: slug, secondary: secondary.filter((other) => other !== slug) });
  }

  function toggleSecondary(slug: string, checked: boolean) {
    const picked = new Set(secondary);
    if (checked) picked.add(slug);
    else picked.delete(slug);
    // Kept in menu order, whatever order they were ticked in.
    onChange({
      main,
      secondary: choices.map((category) => category.slug).filter((other) => picked.has(other)),
    });
  }

  return (
    <>
      <SelectField
        label={t("admin.articles.editor.category")}
        name="categorySlug"
        value={main}
        onChange={(event) => changeMain(event.target.value)}
        options={[
          { value: "", label: t("admin.articles.editor.chooseCategory") },
          ...choices.map((category) => ({ value: category.slug, label: label(category) })),
        ]}
      />
      <fieldset aria-describedby={hintId} className="flex flex-col">
        <legend className={fieldLabelClasses}>
          {t("admin.articles.editor.secondaryCategories")}
        </legend>
        <p id={hintId} className="mt-1 mb-1 text-xs leading-relaxed text-muted">
          {t("admin.articles.editor.secondaryCategoriesHint")}
        </p>
        {choices
          .filter((category) => category.slug !== main)
          .map((category) => (
            <CheckboxField
              key={category.slug}
              name="secondaryCategories"
              value={category.slug}
              label={label(category)}
              checked={secondary.includes(category.slug)}
              onChange={(event) => toggleSecondary(category.slug, event.target.checked)}
            />
          ))}
      </fieldset>
    </>
  );
}
