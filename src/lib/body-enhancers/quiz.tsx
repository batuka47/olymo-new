import { createRoot, type Root } from "react-dom/client";
import { QuizCard } from "@/components/site/quiz/quiz-card";
import { recordQuizAnswer } from "@/lib/quizzes/actions";
import type { QuizData, QuizLabels } from "@/lib/quizzes/model";

/**
 * Puts the interactive card in each quiz block of the text (figure[data-quiz], written by the Quiz
 * node). The quizzes come with the page; their code loads only on pages that have one.
 */
export function mountQuizzes(root: HTMLElement, quizzes: QuizData[], labels: QuizLabels) {
  const mounted: Root[] = [];
  for (const figure of root.querySelectorAll<HTMLElement>("figure[data-quiz]")) {
    const quiz = quizzes.find((candidate) => candidate.id === figure.dataset.quiz);
    if (!quiz) continue;
    const card = createRoot(figure);
    card.render(<QuizCard quiz={quiz} labels={labels} onAnswer={recordQuizAnswer} />);
    mounted.push(card);
  }
  // Cleanups run while the page's own React render commits; unmounting then is not allowed.
  return () => setTimeout(() => mounted.forEach((card) => card.unmount()));
}
