import "server-only";
import { eventPath } from "@/config/events";
import { sitePages } from "@/config/site-pages";
import { articlePath } from "@/lib/articles/status";
import { QUIZ_COLUMNS, toQuizData } from "@/lib/quizzes/queries";
import type { QuizFormValues } from "@/lib/quizzes/schema";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface AdminQuiz {
  id: string;
  title: string;
  isActive: boolean;
  questionCount: number;
  /** Articles whose text has this quiz's block. */
  articleCount: number;
}

/** Every quiz, newest change first, with how many questions it has and where it is used. */
export async function getQuizzesForAdmin(): Promise<AdminQuiz[]> {
  const supabase = await createClient();
  const [quizzes, usage] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, is_active, quiz_questions(count)")
      .order("updated_at", { ascending: false }),
    supabase.rpc("quiz_article_counts"),
  ]);
  if (quizzes.error) throw quizzes.error;
  if (usage.error) throw usage.error;

  const articleCounts = new Map(usage.data.map((row) => [row.quiz_id, row.article_count]));
  return quizzes.data.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    isActive: quiz.is_active,
    questionCount: quiz.quiz_questions[0]?.count ?? 0,
    articleCount: articleCounts.get(quiz.id) ?? 0,
  }));
}

export async function getQuizForEditing(id: string): Promise<QuizFormValues | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select(`is_active, ${QUIZ_COLUMNS}`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { title, description, orderMode, questions } = toQuizData(data);
  return { title, description, orderMode, isActive: data.is_active, questions };
}

/**
 * Addresses of the pages that show the quiz (articles, events, info pages), to refresh when it
 * changes: their text has the quiz's block.
 */
export async function pagesShowingQuiz(supabase: Supabase, quizId: string): Promise<string[]> {
  const block = `%data-quiz="${quizId}"%`;
  const [articles, events, pages] = await Promise.all([
    supabase.from("articles").select("slug, category_slug").like("body_html", block),
    supabase.from("events").select("slug").like("body_html", block),
    supabase.from("site_pages").select("slug").like("body_html", block),
  ]);
  return [
    ...(articles.data ?? []).map((article) => articlePath(article.category_slug, article.slug)),
    ...(events.data ?? []).map((event) => eventPath(event.slug)),
    ...(pages.data ?? []).flatMap(
      (page) => sitePages.find((known) => known.slug === page.slug)?.href ?? [],
    ),
  ];
}
