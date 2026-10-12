import type { QuizOption, QuizQuestion } from "./model";
import type { QuizFormValues } from "./schema";

// Blank pieces for the editor in /admin/quizzes. Ids are made here, in the browser or on the
// server, so a question keeps its id (and its answer counts) from the first save on.

export function newOption(): QuizOption {
  return { id: crypto.randomUUID(), text: "", isCorrect: false };
}

/** Two empty options, none marked correct: the editor has to say which one is. */
export function newQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    text: "",
    imagePath: null,
    imageAlt: "",
    explanation: "",
    options: [newOption(), newOption()],
  };
}

export function emptyQuizValues(): QuizFormValues {
  return {
    title: "",
    description: "",
    orderMode: "fixed",
    isActive: true,
    questions: [newQuestion()],
  };
}

/** `items` with the one at `from` moved to `to`; unchanged when `to` is outside the list. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const moved = [...items];
  if (to < 0 || to >= moved.length) return moved;
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);
  return moved;
}
