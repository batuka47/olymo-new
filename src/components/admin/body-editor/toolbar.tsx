"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { useId, type ReactNode } from "react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "@/components/icons";
import { cx } from "@/lib/cx";
import { TEXT_ALIGNMENTS, type TextAlignment } from "@/lib/editor/extensions";
import { TEXT_SIZES, type TextSize } from "@/lib/editor/nodes";
import { t } from "@/lib/i18n";
import { blockLabel, currentTextSize, setTextSize, type BlockDialog } from "./blocks";

const ALIGN_ICONS: Record<TextAlignment, (props: { className?: string }) => ReactNode> = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
};

/** Blocks the toolbar inserts, the same as in the "/" menu. */
const INSERTS: BlockDialog[] = ["image", "gallery", "youtube", "social", "embed"];

interface ToolbarProps {
  editor: Editor;
  onOpenDialog: (dialog: BlockDialog | "link") => void;
}

/** Always at the top of the editor, for writers who never type "/". */
export function Toolbar({ editor, onOpenDialog }: ToolbarProps) {
  const sizeId = useId();
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      size: currentTextSize(current),
      align: TEXT_ALIGNMENTS.find((align) => current.isActive({ textAlign: align })) ?? null,
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      link: current.isActive("link"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      quote: current.isActive("blockquote"),
      table: current.isActive("table"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-[var(--editor-bar-height,0px)] z-10 border-b border-line bg-paper">
      <div
        role="toolbar"
        aria-label={t("editor.toolbar.label")}
        className="flex flex-wrap items-center gap-1 p-2"
      >
        <label htmlFor={sizeId} className="sr-only">
          {t("editor.toolbar.textSize")}
        </label>
        <select
          id={sizeId}
          value={state.size ?? ""}
          onChange={(event) => setTextSize(editor, event.target.value as TextSize)}
          className="h-10 cursor-pointer border border-line bg-white px-2 text-sm hover:border-ink"
        >
          {state.size === null && <option value="">—</option>}
          {TEXT_SIZES.map((size) => (
            <option key={size} value={size}>
              {t(`editor.sizes.${size}`)}
            </option>
          ))}
        </select>

        <Group>
          {TEXT_ALIGNMENTS.map((align) => {
            const AlignIcon = ALIGN_ICONS[align];
            return (
              <ToolbarButton
                key={align}
                label={t(`editor.align.${align}`)}
                active={state.align === align}
                onClick={() => chain().setTextAlign(align).run()}
              >
                <AlignIcon className="size-4.5" />
              </ToolbarButton>
            );
          })}
        </Group>

        <Group>
          <ToolbarButton
            label={t("editor.toolbar.bold")}
            active={state.bold}
            onClick={() => chain().toggleBold().run()}
          >
            <b>B</b>
          </ToolbarButton>
          <ToolbarButton
            label={t("editor.toolbar.italic")}
            active={state.italic}
            onClick={() => chain().toggleItalic().run()}
          >
            <i className="font-serif">I</i>
          </ToolbarButton>
          <ToolbarButton
            label={t("editor.toolbar.underline")}
            active={state.underline}
            onClick={() => chain().toggleUnderline().run()}
          >
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton
            label={t("editor.toolbar.strike")}
            active={state.strike}
            onClick={() => chain().toggleStrike().run()}
          >
            <s>S</s>
          </ToolbarButton>
          <ToolbarButton
            label={t("editor.toolbar.link")}
            active={state.link}
            onClick={() => onOpenDialog("link")}
            showLabel
          />
        </Group>

        <Group>
          <ToolbarButton
            label={t("editor.toolbar.bulletList")}
            active={state.bulletList}
            onClick={() => chain().toggleBulletList().run()}
            showLabel
          />
          <ToolbarButton
            label={t("editor.toolbar.orderedList")}
            active={state.orderedList}
            onClick={() => chain().toggleOrderedList().run()}
            showLabel
          />
          <ToolbarButton
            label={t("editor.toolbar.quote")}
            active={state.quote}
            onClick={() => chain().toggleBlockquote().run()}
            showLabel
          />
          <ToolbarButton
            label={t("editor.toolbar.rule")}
            onClick={() => chain().setHorizontalRule().run()}
            showLabel
          />
        </Group>

        <Group>
          {INSERTS.map((dialog) => (
            <ToolbarButton
              key={dialog}
              label={blockLabel(dialog)}
              onClick={() => onOpenDialog(dialog)}
              showLabel
            />
          ))}
          <ToolbarButton
            label={blockLabel("table")}
            onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            showLabel
          />
        </Group>

        <Group>
          <ToolbarButton
            label={t("editor.toolbar.undo")}
            disabled={!state.canUndo}
            onClick={() => chain().undo().run()}
          >
            <span aria-hidden="true">↶</span>
          </ToolbarButton>
          <ToolbarButton
            label={t("editor.toolbar.redo")}
            disabled={!state.canRedo}
            onClick={() => chain().redo().run()}
          >
            <span aria-hidden="true">↷</span>
          </ToolbarButton>
        </Group>
      </div>

      {state.table && <TableTools editor={editor} />}
    </div>
  );
}

/** Rows, columns and the header row of the table the cursor is in. */
function TableTools({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();
  const tools: [string, () => boolean][] = [
    [t("editor.table.addRow"), () => chain().addRowAfter().run()],
    [t("editor.table.removeRow"), () => chain().deleteRow().run()],
    [t("editor.table.addColumn"), () => chain().addColumnAfter().run()],
    [t("editor.table.removeColumn"), () => chain().deleteColumn().run()],
    [t("editor.table.headerRow"), () => chain().toggleHeaderRow().run()],
    [t("editor.table.remove"), () => chain().deleteTable().run()],
  ];
  return (
    <div
      role="toolbar"
      aria-label={t("editor.table.label")}
      className="flex flex-wrap gap-1 border-t border-line px-2 py-1.5"
    >
      {tools.map(([label, run]) => (
        <ToolbarButton key={label} label={label} onClick={run} showLabel />
      ))}
    </div>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1 border-l border-line pl-1">{children}</div>;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** The label as the button text; otherwise `children` show and the label is for screen readers. */
  showLabel?: boolean;
  children?: ReactNode;
}

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  showLabel,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      // The text keeps the focus and selection, so typing goes on right after a click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={showLabel ? undefined : label}
      title={label}
      className={cx(
        "flex h-10 min-w-10 cursor-pointer items-center justify-center border px-2.5 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink",
      )}
    >
      {showLabel ? label : children}
    </button>
  );
}
