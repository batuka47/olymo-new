"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { cx } from "@/lib/cx";
import { BODY_IMAGE_SIZES, IMAGE_LAYOUTS, type ImageLayout } from "@/lib/editor/nodes";
import { t } from "@/lib/i18n";
import { ViewButton, ViewField } from "./view-field";

/** An image in the editor, laid out as readers see it, with its caption, credit and alt text. */
export function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const { src, srcset, alt, width, height, caption, credit } = node.attrs;
  const layout: ImageLayout = IMAGE_LAYOUTS.includes(node.attrs.layout)
    ? node.attrs.layout
    : "text";
  const text = (value: string) => value.trim() || null;

  return (
    <NodeViewWrapper
      as="figure"
      className={cx("figure", `figure-${layout}`, selected && "is-selected")}
      data-layout={layout}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the stored files, as on the page */}
      <img
        src={src}
        srcSet={srcset ?? undefined}
        sizes={BODY_IMAGE_SIZES}
        alt={alt ?? ""}
        width={width ?? undefined}
        height={height ?? undefined}
        draggable={false}
        data-drag-handle
      />
      <div contentEditable={false} className="editor-block-fields">
        <div role="group" aria-label={t("editor.image.layout")} className="flex flex-wrap gap-1">
          {IMAGE_LAYOUTS.map((option) => (
            <ViewButton
              key={option}
              label={t(`editor.image.layouts.${option}`)}
              pressed={layout === option}
              onClick={() => updateAttributes({ layout: option })}
            />
          ))}
          <ViewButton label={t("editor.image.remove")} onClick={deleteNode} className="ml-auto" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ViewField
            label={t("editor.image.caption")}
            value={caption ?? ""}
            onChange={(value) => updateAttributes({ caption: text(value) })}
          />
          <ViewField
            label={t("editor.image.credit")}
            value={credit ?? ""}
            placeholder={t("editor.image.creditPlaceholder")}
            onChange={(value) => updateAttributes({ credit: text(value) })}
          />
        </div>
        <ViewField
          label={t("editor.image.alt")}
          value={alt ?? ""}
          placeholder={t("editor.image.altHint")}
          onChange={(value) => updateAttributes({ alt: value })}
        />
      </div>
    </NodeViewWrapper>
  );
}
