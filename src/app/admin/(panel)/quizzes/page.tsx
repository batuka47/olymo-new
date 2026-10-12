import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { buttonClasses } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";
import { t, type MessageKey } from "@/lib/i18n";
import { getQuizzesForAdmin } from "./data";
import { QuizActiveToggle, QuizRowActions } from "./quiz-row-actions";

export const metadata: Metadata = { title: t("admin.quizzes.title") };

const columns: MessageKey[] = [
  "admin.quizzes.columns.title",
  "admin.quizzes.columns.questions",
  "admin.quizzes.columns.active",
  "admin.quizzes.columns.usage",
  "admin.quizzes.columns.actions",
];

const cellClasses = "px-4 py-4 align-top";

export default async function AdminQuizzesPage() {
  await requireStaff();
  const quizzes = await getQuizzesForAdmin();

  return (
    <>
      <AdminPageHeader
        title={t("admin.quizzes.title")}
        intro={t("admin.quizzes.intro")}
        actions={
          <Link href={`${adminRoutes.quizzes}/new`} className={buttonClasses({ size: "lg" })}>
            + {t("admin.quizzes.new")}
          </Link>
        }
      />

      {quizzes.length === 0 ? (
        <p className="border border-line p-8 text-center text-muted">{t("admin.quizzes.empty")}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead className="font-mono text-[11px] tracking-label text-muted uppercase">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className="px-4 py-3 font-normal">
                    {t(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id} data-quiz={quiz.id} className="border-t border-line">
                  <td className={`${cellClasses} max-w-80`}>
                    <Link
                      href={`${adminRoutes.quizzes}/${quiz.id}`}
                      className="text-[15px] font-semibold hover:underline"
                    >
                      {quiz.title}
                    </Link>
                  </td>
                  <td className={`${cellClasses} whitespace-nowrap`}>
                    {t("admin.quizzes.questionCount", { count: quiz.questionCount })}
                  </td>
                  <td className={cellClasses}>
                    <QuizActiveToggle id={quiz.id} active={quiz.isActive} />
                  </td>
                  <td className={`${cellClasses} whitespace-nowrap`}>
                    {t("admin.quizzes.usage", { count: quiz.articleCount })}
                  </td>
                  <td className={cellClasses}>
                    <QuizRowActions quiz={quiz} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
