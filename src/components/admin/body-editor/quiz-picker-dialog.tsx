"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { listQuizChoices, type QuizChoice } from "@/app/admin/(panel)/quizzes/actions";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";

interface QuizPickerDialogProps {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}

/** "Quiz": pick one of the active quizzes built in /admin/quizzes; the text keeps only its id. */
export function QuizPickerDialog({ editor, open, onClose }: QuizPickerDialogProps) {
  // null while the list loads; it is read again each time the dialog opens.
  const [choices, setChoices] = useState<QuizChoice[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    let wanted = true;
    listQuizChoices()
      .then((list) => wanted && setChoices(list))
      .catch(() => wanted && setError(t("admin.quizzes.errors.saveFailed")));
    return () => {
      wanted = false;
    };
  }, [open]);

  function close() {
    setChoices(null);
    setError(undefined);
    onClose();
  }

  function insert(quiz: QuizChoice) {
    editor
      .chain()
      .focus()
      .insertContent({ type: "quiz", attrs: { quizId: quiz.id, title: quiz.title } })
      .run();
    close();
  }

  return (
    <Modal open={open} title={t("editor.quiz.title")} onClose={close}>
      <div className="flex flex-col gap-4">
        <FormMessage state={{ error }} />
        {choices === null && !error && (
          <p role="status" className="text-sm text-muted">
            {t("editor.quiz.loading")}
          </p>
        )}
        {choices?.length === 0 && <p className="text-sm">{t("editor.quiz.empty")}</p>}
        {choices && choices.length > 0 && (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {choices.map((quiz) => (
              <li key={quiz.id}>
                <button
                  type="button"
                  onClick={() => insert(quiz)}
                  aria-label={t("editor.quiz.choose", { title: quiz.title })}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 border border-ink bg-white px-3 py-2 text-left hover:bg-ink hover:text-paper"
                >
                  <span className="font-semibold">{quiz.title}</span>
                  <span className="shrink-0 font-mono text-xs">
                    {t("editor.quiz.questionCount", { count: quiz.questionCount })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={adminRoutes.quizzes}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            {t("editor.quiz.manage")}
          </a>
          <Button variant="outline" onClick={close}>
            {t("editor.dialog.cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
