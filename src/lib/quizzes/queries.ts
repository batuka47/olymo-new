import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { QuizData, QuizOrderMode } from "./model";

/** unstable_cache tag of the quizzes pages show; saving or deleting one in /admin/quizzes expires it. */
export const QUIZZES_CACHE_TAG = "quizzes";

export const QUIZ_COLUMNS =
  "id, title, description, order_mode, quiz_questions(id, sort_order, text, image_path, image_alt, explanation, quiz_options(id, sort_order, text, is_correct))";

interface QuizRow {
  id: string;
  title: string;
  description: string;
  order_mode: string;
  quiz_questions: {
    id: string;
    sort_order: number;
    text: string;
    image_path: string | null;
    image_alt: string | null;
    explanation: string;
    quiz_options: { id: string; sort_order: number; text: string; is_correct: boolean }[];
  }[];
}

const bySortOrder = (one: { sort_order: number }, other: { sort_order: number }) =>
  one.sort_order - other.sort_order;

/** A quiz row with its questions and options, in order, as the card takes it. */
export function toQuizData(row: QuizRow): QuizData {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    orderMode: row.order_mode as QuizOrderMode,
    questions: [...row.quiz_questions].sort(bySortOrder).map((question) => ({
      id: question.id,
      text: question.text,
      imagePath: question.image_path,
      imageAlt: question.image_alt ?? "",
      explanation: question.explanation,
      options: [...question.quiz_options].sort(bySortOrder).map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.is_correct,
      })),
    })),
  };
}

const loadActiveQuizzes = unstable_cache(
  async (ids: string[]): Promise<QuizData[]> => {
    // RLS on the public client: active quizzes only.
    const { data, error } = await createPublicClient()
      .from("quizzes")
      .select(QUIZ_COLUMNS)
      .in("id", ids);
    if (error) {
      throw error;
    }
    return data.map(toQuizData);
  },
  ["active-quizzes"],
  { revalidate: 60, tags: [QUIZZES_CACHE_TAG] },
);

/** The active quizzes among `ids` (a page's quiz blocks); inactive and deleted ones are left out. */
export function getActiveQuizzes(ids: string[]): Promise<QuizData[]> {
  return ids.length === 0 ? Promise.resolve([]) : loadActiveQuizzes([...new Set(ids)].sort());
}
