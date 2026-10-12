"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { adminRoutes } from "@/config/admin";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { ViewButton } from "./view-field";

/**
 * A quiz in the editor: its name as it was when inserted, and the way to its own editor. Readers
 * get the quiz as it is now (the text keeps only the id).
 */
export function QuizView({ node, deleteNode, selected }: ReactNodeViewProps) {
  const quizId = String(node.attrs.quizId ?? "");

  return (
    <NodeViewWrapper
      className={cx("editor-embed", selected && "is-selected")}
      data-quiz={quizId}
      data-drag-handle
    >
      <div contentEditable={false} className="flex flex-col gap-2 border border-ink bg-white p-4">
        <span className="self-start bg-lime px-2 py-0.5 font-mono text-xs font-bold tracking-label uppercase">
          {t("editor.blocks.quiz.label")}
        </span>
        <span className="font-display text-lg leading-tight font-bold">
          {node.attrs.title || quizId}
        </span>
      </div>
      <div contentEditable={false} className="editor-block-fields">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`${adminRoutes.quizzes}/${quizId}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            {t("editor.quiz.edit")}
          </a>
          <ViewButton label={t("editor.handle.remove")} onClick={deleteNode} />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
