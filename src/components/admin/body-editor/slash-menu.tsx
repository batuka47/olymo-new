"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { blockHint, blockLabel, findBlocks, type Block } from "./blocks";
import { requestDialog } from "./editor-events";

/** Runs a block from the menu: the "/query" text is removed first. */
function runBlock(editor: Editor, block: Block, range: Range) {
  editor.chain().focus().deleteRange(range).run();
  if (typeof block.action === "function") {
    block.action(editor);
  } else {
    requestDialog(editor, block.action.dialog);
  }
}

interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

type SlashMenuProps = SuggestionProps<Block, Block>;

/** The list under the cursor: ↑↓ choose, Enter inserts, Esc closes. */
const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu(
  { items, command, clientRect },
  ref,
) {
  // The highlight starts again at the top whenever the search changes the list.
  const [selection, setSelection] = useState({ items, index: 0 });
  const selected = selection.items === items ? selection.index : 0;
  const select = (index: number) => setSelection({ items, index });
  const listRef = useRef<HTMLUListElement>(null);
  const rect = clientRect?.();

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (items.length === 0) return false;
      if (event.key === "ArrowDown") {
        select((selected + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        select((selected - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (!rect) return null;
  return (
    <div
      className="fixed z-50 w-72 border border-ink bg-white shadow-none"
      style={{
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)),
      }}
    >
      <p className="border-b border-line px-3 py-2 font-mono text-[11px] tracking-label text-muted uppercase">
        {t("editor.menu.label")}
      </p>
      {items.length === 0 ? (
        <p className="px-3 py-3 text-sm text-muted">{t("editor.menu.empty")}</p>
      ) : (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t("editor.menu.label")}
          className="max-h-80 overflow-y-auto"
        >
          {items.map((block, index) => (
            <li
              key={block.id}
              role="option"
              aria-selected={index === selected}
              data-index={index}
              className={cx(
                "flex cursor-pointer flex-col px-3 py-2",
                index === selected ? "bg-ink text-paper" : "hover:bg-stone",
              )}
              onMouseEnter={() => select(index)}
              onMouseDown={(event) => {
                // Keep the editor focused: the click must not move the cursor away from "/".
                event.preventDefault();
                command(block);
              }}
            >
              <span className="text-sm font-semibold">{blockLabel(block.id)}</span>
              <span className={cx("text-xs", index === selected ? "text-fog" : "text-muted")}>
                {blockHint(block.id)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-line px-3 py-1.5 font-mono text-[10px] text-muted">
        {t("editor.menu.hint")}
      </p>
    </div>
  );
});

/** "/" on an empty line opens the block menu; typing after it searches. */
export const SlashCommand = Extension.create({
  name: "slashCommand",
  addProseMirrorPlugins() {
    return [
      Suggestion<Block, Block>({
        editor: this.editor,
        char: "/",
        startOfLine: true,
        // The whole line is the search, so "/гарчиг 1" works.
        allowSpaces: true,
        // Only on an empty line of the text itself: "/" inside a sentence (dates, links), a table
        // cell, a quote or a list is just a slash.
        allow: ({ state, range }) => {
          const line = state.doc.resolve(range.from);
          return (
            line.depth === 1 &&
            line.parent.type.name === "paragraph" &&
            line.parent.textContent.trim().startsWith("/")
          );
        },
        items: ({ query }) => findBlocks(query),
        command: ({ editor, range, props }) => runBlock(editor, props, range),
        render: () => {
          let menu: ReactRenderer<SlashMenuHandle, SlashMenuProps> | null = null;
          return {
            onStart: (props) => {
              menu = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              document.body.append(menu.element);
            },
            onUpdate: (props) => menu?.updateProps(props),
            onKeyDown: ({ event }: SuggestionKeyDownProps) => {
              if (event.key === "Escape") {
                menu?.destroy();
                menu?.element.remove();
                menu = null;
                return true;
              }
              return menu?.ref?.onKeyDown(event) ?? false;
            },
            onExit: () => {
              menu?.destroy();
              menu?.element.remove();
              menu = null;
            },
          };
        },
      }),
    ];
  },
});
