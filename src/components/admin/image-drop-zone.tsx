"use client";

import { useId, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import {
  ACCEPTED_IMAGE_TYPES,
  formatFileSize,
  MAX_SOURCE_BYTES,
  type EncodedImage,
} from "@/lib/images/encode";

type Phase = "idle" | "converting" | "uploading";

interface ImageDropZoneProps<T extends EncodedImage> {
  /** Name of the file input (for tests and autofill tools; the file is never posted). */
  name: string;
  /** Saved path of the 1600 px variant, or null. */
  path: string | null;
  /** Sizes the preview with the proportions the site uses, e.g. "aspect-video w-full". */
  previewClassName: string;
  hint: string;
  /** Resizes the file in the browser (see lib/images/encode). */
  encode: (file: File) => Promise<T>;
  /** Uploads the encoded image and returns the path to save. */
  store: (image: T) => Promise<string>;
  onUploaded: (path: string) => void;
  onRemove?: () => void;
  removeLabel?: string;
}

/**
 * Drop or choose an image: it is resized in the browser (WebP, or JPEG where WebP cannot be made),
 * uploaded, previewed, and the stored sizes are listed.
 */
export function ImageDropZone<T extends EncodedImage>({
  name,
  path,
  previewClassName,
  hint,
  encode,
  store,
  onUploaded,
  onRemove,
  removeLabel,
}: ImageDropZoneProps<T>) {
  const inputId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<{ format: string; sizes: string[] } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(t("admin.image.invalidType"));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError(t("admin.image.tooLarge"));
      return;
    }

    setError(undefined);
    try {
      setPhase("converting");
      const image = await encode(file);
      setPhase("uploading");
      const uploadedPath = await store(image);
      setSaved({
        format: image.format.label,
        sizes: image.variants.map(({ width, blob }) => `${width}px · ${formatFileSize(blob.size)}`),
      });
      onUploaded(uploadedPath);
    } catch {
      setError(t("admin.image.failed"));
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
            alt=""
            sizes="(min-width: 1024px) 640px, 100vw"
            className={cx("mb-3", previewClassName)}
          />
        )}
        {busy ? (
          <p role="status" className="font-mono text-xs tracking-label uppercase">
            {phase === "converting" ? t("admin.image.converting") : t("admin.image.uploading")}
          </p>
        ) : (
          <p className="text-sm">
            {t("admin.image.drop")}{" "}
            <label
              htmlFor={inputId}
              className="cursor-pointer font-semibold text-accent underline underline-offset-4"
            >
              {t("admin.image.choose")}
            </label>
          </p>
        )}
        <input
          id={inputId}
          name={name}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="max-w-md text-xs text-muted">{hint}</p>
      </div>

      <FormMessage state={{ error }} />

      {saved && (
        <p className="font-mono text-[11px] text-muted">
          {t("admin.image.sizes", { format: saved.format })}: {saved.sizes.join("  |  ")}
        </p>
      )}

      {path && onRemove && (
        <div>
          <Button variant="outline" onClick={onRemove} disabled={busy}>
            {removeLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
