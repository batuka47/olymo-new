"use client";

import { DragHandle } from "@tiptap/extension-drag-handle-react";
import type { Editor } from "@tiptap/react";
import { useRef } from "react";
import { t } from "@/lib/i18n";

/**
 * Left of the block under the pointer: "+" adds an empty line below it with the "/" menu open,
 * and the grip drags the block to another place.
 */
export function BlockHandle({ editor }: { editor: Editor }) {
  const hovered = useRef<{ pos: number; size: number } | null>(null);

  function addBelow() {
    const block = hovered.current;
    if (!block) return;
    const after = block.pos + block.size;
    editor
      .chain()
      .focus()
      .insertContentAt(after, { type: "paragraph" })
      .setTextSelection(after + 1)
      .insertContent("/")
      .run();
  }

  return (
    <DragHandle
      editor={editor}
      onNodeChange={({ node, pos }) => {
        hovered.current = node ? { pos, size: node.nodeSize } : null;
      }}
    >
      <div className="flex items-center gap-0.5 pr-1.5">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addBelow}
          aria-label={t("editor.handle.add")}
          title={t("editor.handle.add")}
          className="flex size-7 cursor-pointer items-center justify-center text-lg leading-none text-muted hover:bg-stone hover:text-ink"
        >
          +
        </button>
        <span
          aria-hidden="true"
          title={t("editor.handle.drag")}
          className="flex size-7 cursor-grab items-center justify-center text-muted hover:bg-stone hover:text-ink active:cursor-grabbing"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="3" r="1.5" />
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="13" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </span>
      </div>
    </DragHandle>
  );
}
