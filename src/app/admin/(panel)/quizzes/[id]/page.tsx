import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { emptyQuizValues } from "@/lib/quizzes/form";
import { getQuizForEditing } from "../data";
import { QuizEditor } from "../quiz-editor";

export async function generateMetadata({
  searchParams,
}: PageProps<"/admin/quizzes/[id]">): Promise<Metadata> {
  const { new: isNew } = await searchParams;
  return {
    title: t(isNew ? "admin.quizzes.editor.newTitle" : "admin.quizzes.editor.editTitle"),
  };
}

export default async function EditQuizPage({
  params,
  searchParams,
}: PageProps<"/admin/quizzes/[id]">) {
  await requireStaff();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const quiz = await getQuizForEditing(id);
  // ?new=1 comes from /admin/quizzes/new: the quiz is created on its first save.
  if (!quiz && !isNew) {
    notFound();
  }

  return (
    <QuizEditor
      key={id}
      quizId={id}
      initialValues={quiz ?? emptyQuizValues()}
      exists={quiz !== null}
    />
  );
}
