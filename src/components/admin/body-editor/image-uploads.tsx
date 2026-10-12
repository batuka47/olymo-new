"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { t } from "@/lib/i18n";
import { uploadBodyImage, type BodyImageFiles } from "@/lib/images/body-image";
import { isImageFile, UnreadableImageError } from "@/lib/images/encode";

export type UploadedImage = BodyImageFiles;

export interface ImageUploads {
  /** 0–1 while files are being resized and uploaded, null otherwise. */
  progress: number | null;
  error: string | undefined;
  /** Resizes and uploads image files, one at a time; anything that is not an image is left out. */
  upload: (files: File[]) => Promise<UploadedImage[]>;
}

export function useImageUploads(folder: string): ImageUploads {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  const upload = useCallback(
    async (files: File[]) => {
      const problems = files
        .filter((file) => !isImageFile(file))
        .map((file) => t("editor.image.notImage", { name: file.name }));
      const images = files.filter(isImageFile);
      setError(undefined);

      const uploaded: UploadedImage[] = [];
      // One by one: a dozen full-size phone photos decoded at once can run a phone out of memory.
      for (const [index, file] of images.entries()) {
        setProgress(index / images.length);
        try {
          const result = await uploadBodyImage(file, folder, (fraction) =>
            setProgress((index + fraction) / images.length),
          );
          uploaded.push(result);
        } catch (failure) {
          problems.push(
            failure instanceof UnreadableImageError
              ? t("editor.image.unreadable", { name: file.name })
              : t("editor.image.failed"),
          );
        }
      }

      setProgress(null);
      if (problems.length > 0) setError(problems.join(" "));
      return uploaded;
    },
    [folder],
  );

  return { progress, error, upload };
}

/** Lets node views (the slider's "add images") upload into the article's folder. */
export const ImageUploadsContext = createContext<ImageUploads | null>(null);

export function useImageUploadsContext(): ImageUploads {
  const uploads = useContext(ImageUploadsContext);
  if (!uploads) throw new Error("ImageUploadsContext is missing");
  return uploads;
}
