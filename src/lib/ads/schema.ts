import { z } from "zod";
import { adFormat, adPlacements } from "@/config/ads";
import { t } from "@/lib/i18n";
import { adFolder, isUploadedImagePath, type AdImageKind } from "@/lib/media";
import { isHttpUrl } from "@/lib/url";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Server-side check of the ad form (see AdFormValues). */
export const adInputSchema = z
  .object({
    id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.ads.errors.title") })
      .max(120, { error: () => t("admin.ads.errors.tooLong") }),
    linkUrl: z
      .string()
      .trim()
      .refine(isHttpUrl, { error: () => t("admin.ads.errors.linkUrl") }),
    placement: z.enum(adPlacements, { error: () => t("admin.ads.errors.placement") }),
    imagePath: z.string({ error: () => t("admin.ads.errors.image") }),
    imagePathMobile: z.string().nullable(),
    startDate: z.string().regex(DATE_PATTERN, { error: () => t("admin.ads.errors.startDate") }),
    endDate: z
      .string()
      .refine((value) => value === "" || DATE_PATTERN.test(value), {
        error: () => t("admin.ads.errors.endDate"),
      })
      .transform((value) => value || null),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    // Images can only point at this ad's own folder (see the admin ad form).
    const isOwn = (path: string, kind: AdImageKind) =>
      isUploadedImagePath(path, adFolder(values.id), kind);
    if (!isOwn(values.imagePath, "desktop")) {
      context.addIssue({
        code: "custom",
        message: t("admin.ads.errors.image"),
        path: ["imagePath"],
      });
    }
    if (values.imagePathMobile && !isOwn(values.imagePathMobile, "mobile")) {
      context.addIssue({
        code: "custom",
        message: t("admin.ads.errors.image"),
        path: ["imagePathMobile"],
      });
    }
    if (values.endDate && values.endDate < values.startDate) {
      context.addIssue({
        code: "custom",
        message: t("admin.ads.errors.endBeforeStart"),
        path: ["endDate"],
      });
    }
  })
  .transform((values) => ({
    ...values,
    // article_side has a single image for every screen.
    imagePathMobile: adFormat(values.placement).mobile ? values.imagePathMobile : null,
  }));

export type AdInput = z.input<typeof adInputSchema>;
