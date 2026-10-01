"use client";

import { useId, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { FormMessage } from "@/components/ui/form-message";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { TextField } from "@/components/ui/text-field";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import {
  ACCEPTED_IMAGE_TYPES,
  encodeCoverImage,
  formatFileSize,
  MAX_SOURCE_BYTES,
} from "@/lib/images/encode";
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

type Phase = "idle" | "converting" | "uploading";

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
  const inputId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<{ format: string; sizes: string[] } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(t("admin.articles.cover.invalidType"));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError(t("admin.articles.cover.tooLarge"));
      return;
    }

    setError(undefined);
    try {
      setPhase("converting");
      const image = await encodeCoverImage(file);
      setPhase("uploading");
      const [uploadedPath] = await Promise.all([
        uploadVariants(image, (width, extension) => articleCoverPath(articleId, width, extension)),
        uploadMedia(articleSocialImagePath(articleId), image.socialImage),
      ]);
      setSaved({
        format: image.format.label,
        sizes: image.variants.map(({ width, blob }) => `${width}px · ${formatFileSize(blob.size)}`),
      });
      onUploaded(uploadedPath, Date.now().toString(36));
    } catch {
      setError(t("admin.articles.cover.failed"));
    } finally {
      setPhase("idle");
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  const busy = phase !== "idle";

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cx(
          "flex flex-col items-center justify-center gap-2 border border-dashed p-6 text-center",
          dragging ? "border-accent bg-accent/5" : "border-ink",
          path ? "min-h-0" : "min-h-48",
        )}
      >
        {path && (
          <ResponsiveImage
            path={path}
            version={version}
            alt=""
            sizes="(min-width: 1024px) 640px, 100vw"
            className="mb-3 aspect-video w-full max-w-xl"
          />
        )}
        {busy ? (
          <p role="status" className="font-mono text-xs tracking-label uppercase">
            {phase === "converting"
              ? t("admin.articles.cover.converting")
              : t("admin.articles.cover.uploading")}
          </p>
        ) : (
          <p className="text-sm">
            {t("admin.articles.cover.drop")}{" "}
            <label
              htmlFor={inputId}
              className="cursor-pointer font-semibold text-accent underline underline-offset-4"
            >
              {t("admin.articles.cover.choose")}
            </label>
          </p>
        )}
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="max-w-md text-xs text-muted">{t("admin.articles.cover.hint")}</p>
      </div>

      <FormMessage state={{ error }} />

      {saved && (
        <p className="font-mono text-[11px] text-muted">
          {t("admin.articles.cover.sizes", { format: saved.format })}: {saved.sizes.join("  |  ")}
        </p>
      )}

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
          <div>
            <Button variant="outline" onClick={onRemove} disabled={busy}>
              {t("admin.articles.cover.remove")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
