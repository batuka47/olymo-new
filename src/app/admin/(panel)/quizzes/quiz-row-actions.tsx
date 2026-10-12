"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, buttonClasses } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { deleteQuiz, setQuizActive } from "./actions";
import type { AdminQuiz } from "./data";

/** Switches a quiz on or off from the list; the box flips at once and the list refreshes after. */
export function QuizActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [shownActive, setShownActive] = useOptimistic(active);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(undefined);
    startTransition(async () => {
      setShownActive(next);
      const result = await setQuizActive(id, next);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <CheckboxField
        label={t("admin.quizzes.activeToggle")}
        checked={shownActive}
        onChange={(event) => toggle(event.target.checked)}
      />
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** "Засах" and "Устгах". Deleting a quiz that articles use says so first. */
export function QuizRowActions({ quiz }: { quiz: AdminQuiz }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, startDelete] = useTransition();

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteQuiz(quiz.id);
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`${adminRoutes.quizzes}/${quiz.id}`}
        className={buttonClasses({ variant: "ink" })}
      >
        {t("admin.quizzes.actions.edit")}
      </Link>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        {t("admin.quizzes.actions.delete")}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t("admin.quizzes.delete.title", { title: quiz.title })}
        message={
          quiz.articleCount > 0
            ? t("admin.quizzes.delete.inUse", { count: quiz.articleCount })
            : t("admin.quizzes.delete.message")
        }
        confirmLabel={t("admin.quizzes.delete.confirm")}
        pendingLabel={t("admin.quizzes.delete.pending")}
        pending={deleting}
        error={error}
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirming(false);
          setError(undefined);
        }}
      />
    </div>
  );
}
