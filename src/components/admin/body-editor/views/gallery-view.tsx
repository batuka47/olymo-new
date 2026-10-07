"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef } from "react";
import { cx } from "@/lib/cx";
import type { GalleryImage } from "@/lib/editor/nodes";
import { t } from "@/lib/i18n";
import { IMAGE_INPUT_ACCEPT } from "@/lib/images/encode";
import { useImageUploadsContext, type UploadedImage } from "../image-uploads";
import { ViewButton, ViewField } from "./view-field";

export function galleryImage(image: UploadedImage): GalleryImage {
  return { ...image, alt: "", caption: null };
}

/** The slider in the editor: every image at once, with its caption, order and remove. */
export function GalleryView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const images = (node.attrs.images ?? []) as GalleryImage[];
  const uploads = useImageUploadsContext();
  const fileInput = useRef<HTMLInputElement>(null);

  const setImages = (next: GalleryImage[]) => updateAttributes({ images: next });
  const change = (index: number, changes: Partial<GalleryImage>) =>
    setImages(images.map((image, at) => (at === index ? { ...image, ...changes } : image)));
  const move = (index: number, by: -1 | 1) => {
    const next = [...images];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setImages(next);
  };

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await uploads.upload([...files]);
    setImages([...images, ...uploaded.map(galleryImage)]);
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={cx("editor-gallery", selected && "is-selected")}
      data-drag-handle
    >
      <div contentEditable={false} className="flex flex-col gap-3">
        <p className="font-mono text-[11px] tracking-label text-muted uppercase">
          {t("editor.blocks.gallery.label")} · {images.length}
        </p>
        {images.length === 0 && <p className="text-sm text-muted">{t("editor.gallery.empty")}</p>}
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.src} className="flex flex-col gap-2 border border-line bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a stored body image */}
              <img
                src={image.src}
                srcSet={image.srcset ?? undefined}
                sizes="240px"
                alt=""
                width={image.width}
                height={image.height}
                className="aspect-[4/3] w-full object-cover"
              />
              <ViewField
                label={t("editor.gallery.caption")}
                value={image.caption ?? ""}
                onChange={(value) => change(index, { caption: value.trim() || null })}
              />
              <ViewField
                label={t("editor.image.alt")}
                value={image.alt}
                onChange={(value) => change(index, { alt: value })}
              />
              <div className="flex flex-wrap gap-1">
                {index > 0 && (
                  <ViewButton
                    label={`← ${t("editor.gallery.moveLeft")}`}
                    onClick={() => move(index, -1)}
                  />
                )}
                {index < images.length - 1 && (
                  <ViewButton
                    label={`${t("editor.gallery.moveRight")} →`}
                    onClick={() => move(index, 1)}
                  />
                )}
                <ViewButton
                  label={t("editor.gallery.remove")}
                  onClick={() => setImages(images.filter((_, at) => at !== index))}
                />
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <ViewButton
            label={`+ ${t("editor.gallery.add")}`}
            onClick={() => fileInput.current?.click()}
          />
          <ViewButton label={t("editor.handle.remove")} onClick={deleteNode} />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void add(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}
