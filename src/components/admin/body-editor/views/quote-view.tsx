"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { t } from "@/lib/i18n";
import { ViewField } from "./view-field";

/** "Эшлэл" in the editor: the quoted text, then the optional author line. */
export function QuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="blockquote">
      <NodeViewContent className="quote-text" />
      <div contentEditable={false} className="mt-3">
        <ViewField
          label={t("editor.quote.author")}
          value={node.attrs.author ?? ""}
          placeholder={t("editor.quote.authorPlaceholder")}
          onChange={(value) => updateAttributes({ author: value.trim() ? value : null })}
        />
      </div>
    </NodeViewWrapper>
  );
}
