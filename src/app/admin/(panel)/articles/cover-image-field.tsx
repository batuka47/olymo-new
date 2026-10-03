"use client";

import { ImageDropZone } from "@/components/admin/image-drop-zone";
import { CharacterCount } from "@/components/ui/character-count";
import { TextField } from "@/components/ui/text-field";
import { t } from "@/lib/i18n";
import { encodeCoverImage, type EncodedCover } from "@/lib/images/encode";
import { uploadMedia, uploadVariants } from "@/lib/images/upload";
import { articleCoverPath, articleSocialImagePath } from "@/lib/media";

const CAPTION_LIMIT = 200;

interface CoverImageFieldProps {
  articleId: string;
  path: string | null;
  alt: string;
  caption: string;
  /** Cache buster for the preview; changes after every upload. */
  version: string;
  onUploaded: (path: string, version: string) => void;
  onRemove: () => void;
  onAltChange: (alt: string) => void;
  onCaptionChange: (caption: string) => void;
}

export function CoverImageField({
  articleId,
  path,
  alt,
  caption,
  version,
  onUploaded,
  onRemove,
  onAltChange,
  onCaptionChange,
}: CoverImageFieldProps) {
  /** The three widths plus the 1200 × 630 share image; returns the 1600 px path. */
  async function storeCover(image: EncodedCover): Promise<string> {
    const [coverPath] = await Promise.all([
      uploadVariants(image, (width, extension) => articleCoverPath(articleId, width, extension)),
      uploadMedia(articleSocialImagePath(articleId), image.socialImage),
    ]);
    return coverPath;
  }

  return (
    <div className="flex flex-col gap-4">
      <ImageDropZone
        name="coverImage"
        path={path}
        version={version}
        previewClassName="aspect-video w-full max-w-xl"
        hint={t("admin.articles.cover.hint")}
        encode={encodeCoverImage}
        store={storeCover}
        onUploaded={onUploaded}
        onRemove={onRemove}
        removeLabel={t("admin.articles.cover.remove")}
      />

      {path && (
        <>
          <TextField
            label={`${t("admin.articles.cover.alt")} *`}
            name="coverAlt"
            value={alt}
            onChange={(event) => onAltChange(event.target.value)}
            required
            aria-invalid={!alt.trim()}
            hint={t("admin.articles.cover.altHint")}
          />
          <TextField
            label={t("admin.articles.cover.caption")}
            name="coverCaption"
            value={caption}
            maxLength={CAPTION_LIMIT}
            onChange={(event) => onCaptionChange(event.target.value)}
            hint={
              <span className="flex flex-wrap justify-between gap-2">
                {t("admin.articles.cover.captionHint")}
                <CharacterCount value={caption} limit={CAPTION_LIMIT} />
              </span>
            }
          />
        </>
      )}
    </div>
  );
}
