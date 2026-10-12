"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { EditorBar } from "@/components/admin/editor/editor-bar";
import { EditorPanel } from "@/components/admin/editor/editor-panel";
import { LeaveGuardDialog } from "@/components/admin/editor/leave-guard-dialog";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { adminRoutes } from "@/config/admin";
import { cx } from "@/lib/cx";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { t } from "@/lib/i18n";
import { moveItem, newQuestion } from "@/lib/quizzes/form";
import { quizLabels } from "@/lib/quizzes/labels";
import { QUIZ_LIMITS, QUIZ_ORDER_MODES, type QuizQuestion } from "@/lib/quizzes/model";
import type { QuizFormValues } from "@/lib/quizzes/schema";
import { saveQuiz } from "./actions";
import { QuestionFields } from "./question-fields";

// The reader's card, in the browser only: a "random" quiz shuffles, which a server render cannot match.
const QuizCard = dynamic(
  () => import("@/components/site/quiz/quiz-card").then((module) => module.QuizCard),
  { ssr: false },
);

interface QuizEditorProps {
  quizId: string;
  initialValues: QuizFormValues;
  /** False for a new quiz that has not been saved yet. */
  exists: boolean;
}

/** What makes the preview start over: questions or options added, removed, reordered or re-marked. */
function previewKey(values: QuizFormValues): string {
  const questions = values.questions.map(
    (question) =>
      `${question.id}:${question.options.map((option) => option.id + (option.isCorrect ? "*" : "")).join()}`,
  );
  return [values.orderMode, ...questions].join("|");
}

/** The quiz form with the reader's card beside it, updating as the editor types. */
export function QuizEditor({ quizId, initialValues, exists }: QuizEditorProps) {
  const [values, setValues] = useState(initialValues);
  // JSON of the values as last saved (or as opened); the form is "dirty" when it differs.
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialValues));
  const [isSaved, setIsSaved] = useState(exists);
  const [status, setStatus] = useState<FormState>({});
  const [saving, startSaving] = useTransition();
  const labels = useMemo(() => quizLabels(), []);

  const dirty = JSON.stringify(values) !== savedSnapshot;
  const guard = useLeaveGuard(dirty);

  function update<K extends keyof QuizFormValues>(key: K, value: QuizFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // The last save's message no longer describes what is on the screen.
    setStatus({});
  }

  function updateQuestion(changed: QuizQuestion) {
    update(
      "questions",
      values.questions.map((question) => (question.id === changed.id ? changed : question)),
    );
  }

  function save() {
    setStatus({});
    const snapshot = JSON.stringify(values);
    startSaving(async () => {
      const result = await saveQuiz({ id: quizId, ...values });
      if (result.ok) {
        setSavedSnapshot(snapshot);
        setIsSaved(true);
        setStatus({ success: t("admin.quizzes.editor.saved") });
      } else {
        setStatus({ error: result.error });
      }
    });
  }

  return (
    <>
      <EditorBar
        title={isSaved ? t("admin.quizzes.editor.editTitle") : t("admin.quizzes.editor.newTitle")}
        status={
          <span
            role="status"
            className={cx("font-mono text-[11px]", dirty ? "text-danger" : "text-muted")}
          >
            {dirty && t("admin.quizzes.editor.unsaved")}
            {!dirty && isSaved && t("admin.quizzes.editor.saved")}
          </span>
        }
        actions={
          <Button size="lg" onClick={save} disabled={saving}>
            {saving ? t("admin.quizzes.editor.saving") : t("admin.quizzes.editor.save")}
          </Button>
        }
      />

      <FormMessage state={status} className="mb-6" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <TextField
            label={`${t("admin.quizzes.editor.title")} *`}
            name="title"
            value={values.title}
            maxLength={QUIZ_LIMITS.title}
            required
            onChange={(event) => update("title", event.target.value)}
          />
          <TextAreaField
            label={t("admin.quizzes.editor.description")}
            name="description"
            value={values.description}
            rows={2}
            maxLength={QUIZ_LIMITS.description}
            hint={t("admin.quizzes.editor.descriptionHint")}
            onChange={(event) => update("description", event.target.value)}
          />

          <div className="grid gap-6 border border-line p-5 sm:grid-cols-2">
            <fieldset className="flex flex-col">
              <legend className={cx(fieldLabelClasses, "mb-1")}>
                {t("admin.quizzes.editor.orderMode")}
              </legend>
              {QUIZ_ORDER_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]"
                >
                  <input
                    type="radio"
                    name="orderMode"
                    value={mode}
                    checked={values.orderMode === mode}
                    onChange={() => update("orderMode", mode)}
                    className="size-5 shrink-0 cursor-pointer accent-accent"
                  />
                  {t(`admin.quizzes.editor.orderModes.${mode}`)}
                </label>
              ))}
            </fieldset>
            <div>
              <CheckboxField
                label={t("admin.quizzes.editor.active")}
                name="isActive"
                checked={values.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
              />
              <p className="pl-8 text-xs leading-relaxed text-muted">
                {t("admin.quizzes.editor.activeHint")}
              </p>
            </div>
          </div>

          <h2 className="font-display text-xl font-bold">{t("admin.quizzes.editor.questions")}</h2>
          {values.questions.map((question, index) => (
            <QuestionFields
              key={question.id}
              quizId={quizId}
              question={question}
              number={index + 1}
              isFirst={index === 0}
              isLast={index === values.questions.length - 1}
              onChange={updateQuestion}
              onMove={(step) =>
                update("questions", moveItem(values.questions, index, index + step))
              }
              onRemove={() =>
                update(
                  "questions",
                  values.questions.filter((other) => other.id !== question.id),
                )
              }
            />
          ))}
          {values.questions.length < QUIZ_LIMITS.questions && (
            <Button
              variant="outline"
              size="lg"
              className="self-start"
              onClick={() => update("questions", [...values.questions, newQuestion()])}
            >
              {t("admin.quizzes.editor.addQuestion")}
            </Button>
          )}

          <Link href={adminRoutes.quizzes} className="text-sm underline underline-offset-4">
            ← {t("admin.quizzes.editor.back")}
          </Link>
        </div>

        <aside className="self-start xl:sticky xl:top-24">
          <EditorPanel title={t("admin.quizzes.editor.preview")}>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              {t("admin.quizzes.editor.previewHint")}
            </p>
            {values.questions.length === 0 ? (
              <p className="text-sm text-muted">{t("admin.quizzes.editor.noQuestions")}</p>
            ) : (
              // The card as articles show it: same type size as the article text.
              <div className="article-body" data-testid="quiz-preview">
                <QuizCard
                  key={previewKey(values)}
                  quiz={{ id: quizId, ...values }}
                  labels={labels}
                />
              </div>
            )}
          </EditorPanel>
        </aside>
      </div>

      <LeaveGuardDialog guard={guard} />
    </>
  );
}
