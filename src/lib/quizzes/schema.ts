import { z } from "zod";
import { t } from "@/lib/i18n";
import { isUploadedImagePath, QUIZ_IMAGE_NAME, quizFolder } from "@/lib/media";
import { QUIZ_LIMITS, QUIZ_ORDER_MODES, type QuizData, type QuizOrderMode } from "./model";

/** What the editor in /admin/quizzes edits. Ids are made in the browser, so answers keep counting. */
export interface QuizFormValues {
  title: string;
  description: string;
  orderMode: QuizOrderMode;
  isActive: boolean;
  questions: QuizData["questions"];
}

const tooLong = () => t("admin.quizzes.errors.tooLong");

const optionSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().max(QUIZ_LIMITS.option, { error: tooLong }),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().max(QUIZ_LIMITS.question, { error: tooLong }),
  imagePath: z.string().nullable(),
  imageAlt: z.string().trim().max(QUIZ_LIMITS.imageAlt, { error: tooLong }),
  explanation: z.string().trim().max(QUIZ_LIMITS.explanation, { error: tooLong }),
  options: z.array(optionSchema).max(QUIZ_LIMITS.maxOptions),
});

export const quizInputSchema = z
  .object({
    id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, { error: () => t("admin.quizzes.errors.title") })
      .max(QUIZ_LIMITS.title, { error: tooLong }),
    description: z.string().trim().max(QUIZ_LIMITS.description, { error: tooLong }),
    orderMode: z.enum(QUIZ_ORDER_MODES),
    isActive: z.boolean(),
    questions: z
      .array(questionSchema)
      .min(1, { error: () => t("admin.quizzes.errors.noQuestions") })
      .max(QUIZ_LIMITS.questions),
  })
  .superRefine((quiz, context) => {
    // Problems are named by question number, the way the editor shows them.
    quiz.questions.forEach((question, index) => {
      const number = index + 1;
      const problem = (key: Parameters<typeof t>[0]) =>
        context.addIssue({
          code: "custom",
          message: t(key, { number }),
          path: ["questions", index],
        });
      if (!question.text) problem("admin.quizzes.errors.questionText");
      if (question.options.length < QUIZ_LIMITS.minOptions) problem("admin.quizzes.errors.options");
      if (question.options.some((option) => !option.text)) {
        problem("admin.quizzes.errors.optionText");
      }
      // The database refuses anything else too (quiz_question_has_one_correct_option).
      if (question.options.filter((option) => option.isCorrect).length !== 1) {
        problem("admin.quizzes.errors.oneCorrect");
      }
      if (
        question.imagePath &&
        !isUploadedImagePath(question.imagePath, quizFolder(quiz.id), QUIZ_IMAGE_NAME)
      ) {
        problem("admin.quizzes.errors.image");
      }
      if (question.imagePath && !question.imageAlt) problem("admin.quizzes.errors.imageAlt");
    });
  });

export type QuizInput = z.input<typeof quizInputSchema>;

/** The JSON save_quiz takes (migration 20261015000100): snake case, positions as sort_order. */
export function toSaveQuizPayload(quiz: z.output<typeof quizInputSchema>) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    order_mode: quiz.orderMode,
    is_active: quiz.isActive,
    questions: quiz.questions.map((question, index) => ({
      id: question.id,
      sort_order: index + 1,
      text: question.text,
      image_path: question.imagePath,
      image_alt: question.imagePath ? question.imageAlt : null,
      explanation: question.explanation,
      options: question.options.map((option, position) => ({
        id: option.id,
        sort_order: position + 1,
        text: option.text,
        is_correct: option.isCorrect,
      })),
    })),
  };
}
