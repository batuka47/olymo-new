import { z } from "zod";
import { sitePageSlugs } from "@/config/site-pages";
import { t } from "@/lib/i18n";
import { IMAGE_EXTENSIONS, teamPhotoPath } from "@/lib/media";
import { sitePageBlocksSchema } from "@/lib/site-pages/blocks";

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 300;
export const QUESTION_MAX = 300;
export const ANSWER_MAX = 3000;
export const NAME_MAX = 100;
export const ROLE_MAX = 100;

const tooLong = () => t("admin.pages.errors.tooLong");

const faqItemSchema = z.object({
  id: z.uuid(),
  question: z
    .string()
    .trim()
    .min(1, { error: () => t("admin.pages.errors.question") })
    .max(QUESTION_MAX, { error: tooLong }),
  answer: z
    .string()
    .trim()
    .min(1, { error: () => t("admin.pages.errors.answer") })
    .max(ANSWER_MAX, { error: tooLong }),
});

const teamMemberSchema = z
  .object({
    id: z.uuid(),
    name: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.pages.errors.name") })
      .max(NAME_MAX, { error: tooLong }),
    role: z.string().trim().max(ROLE_MAX, { error: tooLong }),
    photoPath: z.string().nullable(),
  })
  // The photo must be the one uploaded for this member, not a path into someone else's folder.
  .refine(
    (member) =>
      member.photoPath === null ||
      IMAGE_EXTENSIONS.some(
        (extension) => member.photoPath === teamPhotoPath(member.id, 1600, extension),
      ),
    { error: () => t("admin.pages.errors.photo") },
  );

/** Server-side check of the /admin/pages editor (see SitePageFormValues). */
export const sitePageInputSchema = z.object({
  slug: z.enum(sitePageSlugs),
  title: z
    .string()
    .trim()
    .min(1, { error: () => t("admin.pages.errors.title") })
    .max(TITLE_MAX, { error: tooLong }),
  description: z.string().trim().max(DESCRIPTION_MAX, { error: tooLong }),
  /** null: the body was not touched (it may still be the seeded HTML, which is kept). */
  bodyJson: z
    .object({ type: z.literal("doc") })
    .loose()
    .nullable(),
  blocks: sitePageBlocksSchema,
  faq: z.array(faqItemSchema).max(50),
  team: z.array(teamMemberSchema).max(24),
});

export type SitePageInput = z.input<typeof sitePageInputSchema>;
