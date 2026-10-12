import { t } from "@/lib/i18n";
import type { QuizLabels } from "./model";

/** The card's texts. Built on the server for pages (the browser gets only these strings). */
export function quizLabels(): QuizLabels {
  return {
    kicker: t("quiz.kicker"),
    progress: t("quiz.progress"),
    options: t("quiz.options"),
    correct: t("quiz.correct"),
    wrong: t("quiz.wrong"),
    correctAnswer: t("quiz.correctAnswer"),
    readersCorrect: t("quiz.readersCorrect"),
    next: t("quiz.next"),
    finish: t("quiz.finish"),
    score: t("quiz.score"),
    result: {
      perfect: t("quiz.result.perfect"),
      good: t("quiz.result.good"),
      fair: t("quiz.result.fair"),
      low: t("quiz.result.low"),
    },
    retry: t("quiz.retry"),
    shareText: t("quiz.shareText"),
    shareLabel: t("quiz.shareLabel"),
    copied: t("quiz.copied"),
  };
}
