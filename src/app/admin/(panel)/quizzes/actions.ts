"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { quizFolder } from "@/lib/media";
import { removeFolder } from "@/lib/media-cleanup";
import { QUIZZES_CACHE_TAG } from "@/lib/quizzes/queries";
import { quizInputSchema, toSaveQuizPayload, type QuizInput } from "@/lib/quizzes/schema";
import { createClient } from "@/lib/supabase/server";
import { pagesShowingQuiz } from "./data";

export interface QuizActionResult {
  ok: boolean;
  error?: string;
}

/** A quiz the article editor's "Quiz" block can insert. */
export interface QuizChoice {
  id: string;
  title: string;
  questionCount: number;
}

/** Pages read quizzes when shown: expire the cached quizzes and the pages that show this one. */
function refreshQuizPages(paths: string[]) {
  updateTag(QUIZZES_CACHE_TAG);
  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath(adminRoutes.quizzes);
}

const isQuizId = (id: string) => z.uuid().safeParse(id).success;

/** Creates or updates a quiz with its questions and options, in one transaction (save_quiz). */
export async function saveQuiz(input: QuizInput): Promise<QuizActionResult> {
  await requireStaff();
  const parsed = quizInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? t("admin.quizzes.errors.saveFailed"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_quiz", { quiz: toSaveQuizPayload(parsed.data) });
  if (error) {
    console.error(`Saving quiz ${parsed.data.id} failed`, error);
    return { ok: false, error: t("admin.quizzes.errors.saveFailed") };
  }

  refreshQuizPages(await pagesShowingQuiz(supabase, parsed.data.id));
  return { ok: true };
}

/** The "Идэвхтэй" box in the list: an inactive quiz shows nothing in its articles. */
export async function setQuizActive(id: string, active: boolean): Promise<QuizActionResult> {
  await requireStaff();
  if (!isQuizId(id)) {
    return { ok: false, error: t("admin.quizzes.errors.saveFailed") };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").update({ is_active: active }).eq("id", id);
  if (error) {
    return { ok: false, error: t("admin.quizzes.errors.saveFailed") };
  }
  refreshQuizPages(await pagesShowingQuiz(supabase, id));
  return { ok: true };
}

/**
 * Deletes a quiz, its questions, answer counts and images. Articles keep the block in their text
 * and simply show nothing there (see ArticleBodyHtml).
 */
export async function deleteQuiz(id: string): Promise<QuizActionResult> {
  await requireStaff();
  if (!isQuizId(id)) {
    return { ok: false, error: t("admin.quizzes.errors.deleteFailed") };
  }
  const supabase = await createClient();
  const pages = await pagesShowingQuiz(supabase, id);
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) {
    console.error(`Deleting quiz ${id} failed`, error);
    return { ok: false, error: t("admin.quizzes.errors.deleteFailed") };
  }
  try {
    await removeFolder(supabase, quizFolder(id));
  } catch (cleanupError) {
    // The quiz is gone; leftover images are removed by the dashboard's cleanup later.
    console.error(`Removing the images of quiz ${id} failed`, cleanupError);
  }
  refreshQuizPages(pages);
  return { ok: true };
}

/** Active quizzes with at least one question, newest first, for the editor's picker. */
export async function listQuizChoices(): Promise<QuizChoice[]> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, quiz_questions(count)")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data
    .map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      questionCount: quiz.quiz_questions[0]?.count ?? 0,
    }))
    .filter((quiz) => quiz.questionCount > 0);
}
