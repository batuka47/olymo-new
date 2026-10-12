import type { QuizData, QuizQuestion, QuizResultBand } from "./model";

// One reader's attempt at a quiz: which questions in what order, what was answered (answers lock a
// question), and the score. Pure, so it is tested without a browser.

export interface Attempt {
  /** Question ids in the order shown. */
  order: string[];
  /** Question id → the option chosen. An answered question is locked. */
  answers: Record<string, string>;
  /** Index into `order` of the question shown; order.length once finished. */
  current: number;
}

/** Fisher–Yates; `random` returns [0, 1) like Math.random (tests pass their own). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** "Дарааллын төрөл": questions as written, or shuffled for each attempt. Options keep their order. */
export function startAttempt(quiz: QuizData, random: () => number = Math.random): Attempt {
  const ids = quiz.questions.map((question) => question.id);
  return {
    order: quiz.orderMode === "random" ? shuffle(ids, random) : ids,
    answers: {},
    current: 0,
  };
}

export function findQuestion(quiz: QuizData, id: string): QuizQuestion | undefined {
  return quiz.questions.find((question) => question.id === id);
}

export function currentQuestion(quiz: QuizData, attempt: Attempt): QuizQuestion | undefined {
  const id = attempt.order[attempt.current];
  return id === undefined ? undefined : findQuestion(quiz, id);
}

export function isCorrectOption(quiz: QuizData, questionId: string, optionId: string): boolean {
  return (
    findQuestion(quiz, questionId)?.options.find((option) => option.id === optionId)?.isCorrect ??
    false
  );
}

/** Records an answer; a question already answered keeps its first answer. */
export function answer(attempt: Attempt, questionId: string, optionId: string): Attempt {
  if (questionId in attempt.answers) {
    return attempt;
  }
  return { ...attempt, answers: { ...attempt.answers, [questionId]: optionId } };
}

/** On to the next question, once the shown one is answered. */
export function advance(attempt: Attempt): Attempt {
  const shown = attempt.order[attempt.current];
  if (shown === undefined || !(shown in attempt.answers)) {
    return attempt;
  }
  return { ...attempt, current: attempt.current + 1 };
}

export function isFinished(attempt: Attempt): boolean {
  return attempt.current >= attempt.order.length;
}

export function score(quiz: QuizData, attempt: Attempt): number {
  return Object.entries(attempt.answers).filter(([questionId, optionId]) =>
    isCorrectOption(quiz, questionId, optionId),
  ).length;
}

/** The short message under the final score. */
export function resultBand(points: number, total: number): QuizResultBand {
  const share = total === 0 ? 0 : points / total;
  if (share === 1) return "perfect";
  if (share >= 0.7) return "good";
  if (share >= 0.4) return "fair";
  return "low";
}
