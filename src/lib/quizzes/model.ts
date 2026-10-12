// A quiz as the reader's card and the admin preview use it. No database or server code, so client
// components can import it.

export const QUIZ_ORDER_MODES = ["fixed", "random"] as const;
export type QuizOrderMode = (typeof QUIZ_ORDER_MODES)[number];

/** Also in the quiz tables' constraints (migration 20261015000100). */
export const QUIZ_LIMITS = {
  title: 200,
  description: 500,
  question: 500,
  option: 300,
  explanation: 1000,
  imageAlt: 200,
  questions: 50,
  minOptions: 2,
  maxOptions: 8,
} as const;

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  /** The 1600 px file of an upload in quizzes/{quiz id}/, or null. */
  imagePath: string | null;
  imageAlt: string;
  /** Shown once the question is answered; may be "". */
  explanation: string;
  options: QuizOption[];
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  orderMode: QuizOrderMode;
  questions: QuizQuestion[];
}

/** Every text the card shows, filled in on the server so the page needs no message file. */
export interface QuizLabels {
  kicker: string;
  /** "{current} / {total}" */
  progress: string;
  options: string;
  correct: string;
  wrong: string;
  /** "Зөв хариулт: {answer}" */
  correctAnswer: string;
  /** "Уншигчдын {percent}% зөв хариулсан" */
  readersCorrect: string;
  next: string;
  finish: string;
  /** "{score} / {total}" */
  score: string;
  result: Record<QuizResultBand, string>;
  retry: string;
  /** "Би {score}/{total} авлаа" */
  shareText: string;
  shareLabel: string;
  copied: string;
}

export type QuizResultBand = "perfect" | "good" | "fair" | "low";

/** Fills "{name}" placeholders, like t() does on the server. */
export function fillLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}
