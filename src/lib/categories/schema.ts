import { z } from "zod";
import { EVENTS_CATEGORY_SLUG } from "@/config/categories";
import { RESERVED_SLUGS } from "@/config/routes";
import { t } from "@/lib/i18n";
import { SLUG_PATTERN } from "@/lib/slug";

/** Also in the categories table's constraints (migration 20261013000100). */
export const CATEGORY_LIMITS = { label: 60, slug: 60, description: 300 } as const;

/** What the form in /admin/categories edits. */
export interface CategoryFormValues {
  label: string;
  slug: string;
  description: string;
  showInNav: boolean;
  isActive: boolean;
  hasOlympiadFields: boolean;
  showOnHome: boolean;
}

const tooLong = () => t("admin.categories.errors.tooLong");

export const categoryInputSchema = z
  .object({
    /** The slug the category had when the form opened; null for a new category. */
    originalSlug: z.string().nullable(),
    label: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.categories.errors.label") })
      .max(CATEGORY_LIMITS.label, { error: tooLong }),
    slug: z
      .string()
      .trim()
      .max(CATEGORY_LIMITS.slug, { error: tooLong })
      .regex(SLUG_PATTERN, { error: () => t("admin.slug.invalid") }),
    description: z.string().trim().max(CATEGORY_LIMITS.description, { error: tooLong }),
    showInNav: z.boolean(),
    isActive: z.boolean(),
    hasOlympiadFields: z.boolean(),
    showOnHome: z.boolean(),
  })
  .superRefine((values, context) => {
    // The events section keeps its reserved address; nothing else may take one.
    const keepsEvents =
      values.originalSlug === EVENTS_CATEGORY_SLUG && values.slug === EVENTS_CATEGORY_SLUG;
    if (RESERVED_SLUGS.has(values.slug) && !keepsEvents) {
      context.addIssue({
        code: "custom",
        message: t("admin.categories.errors.reserved", { slug: values.slug }),
        path: ["slug"],
      });
    }
  });

export type CategoryInput = z.input<typeof categoryInputSchema>;
