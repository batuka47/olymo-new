"use client";

import { ImageDropZone } from "@/components/admin/image-drop-zone";
import { Button } from "@/components/ui/button";
import { fieldLabelClasses, inputClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { encodeImageVariants } from "@/lib/images/encode";
import { uploadVariants } from "@/lib/images/upload";
import { quizImagePath } from "@/lib/media";
import { moveItem, newOption } from "@/lib/quizzes/form";
import { QUIZ_LIMITS, type QuizQuestion } from "@/lib/quizzes/model";

const iconButtonClasses =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center border border-line bg-white text-lg hover:border-ink disabled:cursor-default disabled:opacity-30 disabled:hover:border-line";

interface QuestionFieldsProps {
  quizId: string;
  question: QuizQuestion;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (question: QuizQuestion) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
}

/** One question: its text, optional image, the options with the correct one marked, explanation. */
export function QuestionFields({
  quizId,
  question,
  number,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: QuestionFieldsProps) {
  const title = t("admin.quizzes.editor.question", { number });
  const set = (changes: Partial<QuizQuestion>) => onChange({ ...question, ...changes });
  const setOptions = (options: QuizQuestion["options"]) => set({ options });

  return (
    <section
      aria-label={title}
      data-question={number}
      className="flex flex-col gap-5 border border-line p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            className={iconButtonClasses}
            aria-label={`${t("admin.quizzes.editor.moveUp")}: ${title}`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            type="button"
            className={iconButtonClasses}
            aria-label={`${t("admin.quizzes.editor.moveDown")}: ${title}`}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <span aria-hidden="true">↓</span>
          </button>
          <Button variant="outline" onClick={onRemove}>
            {t("admin.quizzes.editor.removeQuestion")}
          </Button>
        </div>
      </div>

      <TextAreaField
        label={`${t("admin.quizzes.editor.questionText")} *`}
        name={`question-${question.id}-text`}
        value={question.text}
        rows={2}
        maxLength={QUIZ_LIMITS.question}
        onChange={(event) => set({ text: event.target.value })}
      />

      <div className="flex flex-col gap-2">
        <span className={fieldLabelClasses}>{t("admin.quizzes.editor.image")}</span>
        <ImageDropZone
          name={`question-${question.id}-image`}
          path={question.imagePath}
          previewClassName="aspect-video w-full max-w-md"
          hint={t("admin.quizzes.editor.imageHint")}
          encode={encodeImageVariants}
          store={(image) =>
            uploadVariants(image, (token, width, extension) =>
              quizImagePath(quizId, token, width, extension),
            )
          }
          onUploaded={(imagePath) => set({ imagePath })}
          onRemove={() => set({ imagePath: null, imageAlt: "" })}
          removeLabel={t("admin.quizzes.editor.removeImage")}
        />
        {question.imagePath && (
          <TextField
            label={`${t("admin.quizzes.editor.imageAlt")} *`}
            name={`question-${question.id}-image-alt`}
            value={question.imageAlt}
            maxLength={QUIZ_LIMITS.imageAlt}
            onChange={(event) => set({ imageAlt: event.target.value })}
          />
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={fieldLabelClasses}>{t("admin.quizzes.editor.options")}</legend>
        <p className="text-xs text-muted">{t("admin.quizzes.editor.correctHint")}</p>
        <ol className="flex flex-col gap-2">
          {question.options.map((option, index) => {
            const optionName = t("admin.quizzes.editor.option", { number: index + 1 });
            return (
              <li key={option.id} className="flex items-center gap-2">
                <label
                  title={t("admin.quizzes.editor.correct")}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}-correct`}
                    checked={option.isCorrect}
                    aria-label={`${t("admin.quizzes.editor.correct")}: ${optionName}`}
                    onChange={() =>
                      setOptions(
                        question.options.map((other) => ({
                          ...other,
                          isCorrect: other.id === option.id,
                        })),
                      )
                    }
                    className="size-5 cursor-pointer accent-accent"
                  />
                </label>
                <input
                  value={option.text}
                  aria-label={optionName}
                  placeholder={optionName}
                  maxLength={QUIZ_LIMITS.option}
                  onChange={(event) =>
                    setOptions(
                      question.options.map((other) =>
                        other.id === option.id ? { ...other, text: event.target.value } : other,
                      ),
                    )
                  }
                  className={cx(inputClasses, "h-11 min-w-0 flex-1")}
                />
                <button
                  type="button"
                  className={iconButtonClasses}
                  aria-label={`${t("admin.quizzes.editor.moveUp")}: ${optionName}`}
                  disabled={index === 0}
                  onClick={() => setOptions(moveItem(question.options, index, index - 1))}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  className={iconButtonClasses}
                  aria-label={t("admin.quizzes.editor.removeOption", { number: index + 1 })}
                  disabled={question.options.length <= QUIZ_LIMITS.minOptions}
                  onClick={() =>
                    setOptions(question.options.filter((other) => other.id !== option.id))
                  }
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            );
          })}
        </ol>
        {question.options.length < QUIZ_LIMITS.maxOptions && (
          <Button
            variant="outline"
            className="self-start"
            onClick={() => setOptions([...question.options, newOption()])}
          >
            {t("admin.quizzes.editor.addOption")}
          </Button>
        )}
      </fieldset>

      <TextAreaField
        label={t("admin.quizzes.editor.explanation")}
        name={`question-${question.id}-explanation`}
        value={question.explanation}
        rows={2}
        maxLength={QUIZ_LIMITS.explanation}
        hint={t("admin.quizzes.editor.explanationHint")}
        onChange={(event) => set({ explanation: event.target.value })}
      />
    </section>
  );
}
