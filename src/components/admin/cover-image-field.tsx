"use client";

import { ImageDropZone } from "@/components/admin/image-drop-zone";
import { CharacterCount } from "@/components/ui/character-count";
import { TextField } from "@/components/ui/text-field";
import { t } from "@/lib/i18n";
import { encodeCoverImage, type EncodedCover } from "@/lib/images/encode";
import { uploadMedia, uploadVariants } from "@/lib/images/upload";
import { socialImagePath, type VariantPathBuilder } from "@/lib/media";

const CAPTION_LIMIT = 200;

interface CoverImageFieldProps {
  /** Where each width of the cover goes, e.g. articleCoverPath(id, token, width, extension). */
  coverPath: VariantPathBuilder;
  path: string | null;
  alt: string;
  onUploaded: (path: string) => void;
  onRemove: () => void;
  onAltChange: (alt: string) => void;
  /** Optional caption shown under the cover (articles). */
  caption?: { value: string; onChange: (caption: string) => void };
}

/** Cover of an article or event: three widths plus the share image, alt text and caption. */
export function CoverImageField({
  coverPath,
  path,
  alt,
  onUploaded,
  onRemove,
  onAltChange,
  caption,
}: CoverImageFieldProps) {
  async function storeCover(image: EncodedCover): Promise<string> {
    const savedPath = await uploadVariants(image, coverPath);
    // The 1200 × 630 share image sits next to the cover: cover-{token}-og.jpg.
    await uploadMedia(socialImagePath(savedPath), image.socialImage);
    return savedPath;
  }

  return (
    <div className="flex flex-col gap-4">
      <ImageDropZone
        name="coverImage"
        path={path}
        previewClassName="aspect-video w-full max-w-xl"
        hint={t("admin.cover.hint")}
        encode={encodeCoverImage}
        store={storeCover}
        onUploaded={onUploaded}
        onRemove={onRemove}
        removeLabel={t("admin.cover.remove")}
      />

      {path && (
        <>
          <TextField
            label={`${t("admin.cover.alt")} *`}
            name="coverAlt"
            value={alt}
            onChange={(event) => onAltChange(event.target.value)}
            required
            aria-invalid={!alt.trim()}
            hint={t("admin.cover.altHint")}
          />
          {caption && (
            <TextField
              label={t("admin.cover.caption")}
              name="coverCaption"
              value={caption.value}
              maxLength={CAPTION_LIMIT}
              onChange={(event) => caption.onChange(event.target.value)}
              hint={
                <span className="flex flex-wrap justify-between gap-2">
                  {t("admin.cover.captionHint")}
                  <CharacterCount value={caption.value} limit={CAPTION_LIMIT} />
                </span>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
