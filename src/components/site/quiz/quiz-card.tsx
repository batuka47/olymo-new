"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { cx } from "@/lib/cx";
import {
  fillLabel,
  type QuizData,
  type QuizLabels,
  type QuizOption,
  type QuizQuestion,
} from "@/lib/quizzes/model";
import {
  advance,
  answer,
  currentQuestion,
  isFinished,
  resultBand,
  score,
  startAttempt,
  type Attempt,
} from "@/lib/quizzes/play";

/** Option markers, as Mongolian tests letter them. */
const LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

type OptionState = "open" | "correct" | "wrong" | "other";

interface QuizCardProps {
  quiz: QuizData;
  labels: QuizLabels;
  /**
   * Counts the answer and returns the share of readers who got the question right (null if not
   * known). Left out in the admin preview, where answers are not counted.
   */
  onAnswer?: (optionId: string) => Promise<number | null>;
}

function optionState(option: QuizOption, chosenId: string | undefined): OptionState {
  if (!chosenId) return "open";
  if (option.isCorrect) return "correct";
  return option.id === chosenId ? "wrong" : "other";
}

const optionClasses: Record<OptionState, string> = {
  open: "cursor-pointer border-ink bg-white hover:bg-paper",
  correct: "border-success bg-success/10 text-ink",
  wrong: "border-danger bg-danger/10 text-ink",
  other: "border-line bg-white text-muted",
};

/**
 * A quiz in an article: one question at a time. Choosing an option locks the question and shows at
 * once whether it was right, the correct answer, the explanation and how readers did; the end shows
 * the score, a retry and sharing. Mounted by lib/body-enhancers/quiz.tsx, and in the admin preview.
 */
export function QuizCard({ quiz, labels, onAnswer }: QuizCardProps) {
  const [attempt, setAttempt] = useState<Attempt>(() => startAttempt(quiz));
  const [readersCorrect, setReadersCorrect] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  // Focus follows the reader's step (feedback, next question, result), never on first render.
  const [focusTarget, setFocusTarget] = useState<"feedback" | "question" | "result" | null>(null);
  const titleId = useId();
  const questionTextId = useId();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const question = currentQuestion(quiz, attempt);
  const total = attempt.order.length;
  const finished = isFinished(attempt);
  const answered = Object.keys(attempt.answers).length;

  useEffect(() => {
    if (!focusTarget) return;
    const targets = { feedback: feedbackRef, question: questionRef, result: resultRef };
    targets[focusTarget].current?.focus();
  }, [focusTarget, attempt]);

  function choose(chosen: QuizQuestion, option: QuizOption) {
    if (chosen.id in attempt.answers) return;
    setAttempt(answer(attempt, chosen.id, option.id));
    const correct = chosen.options.find((candidate) => candidate.isCorrect);
    setAnnouncement(
      option.isCorrect
        ? labels.correct
        : `${labels.wrong}. ${fillLabel(labels.correctAnswer, { answer: correct?.text ?? "" })}`,
    );
    setFocusTarget("feedback");
    void onAnswer?.(option.id).then((percent) => {
      if (percent !== null) {
        setReadersCorrect((current) => ({ ...current, [chosen.id]: percent }));
      }
    });
  }

  function next() {
    const moved = advance(attempt);
    setAttempt(moved);
    if (isFinished(moved)) {
      const points = score(quiz, moved);
      setAnnouncement(
        `${fillLabel(labels.score, { score: points, total })}. ${labels.result[resultBand(points, total)]}`,
      );
      setFocusTarget("result");
    } else {
      setAnnouncement("");
      setFocusTarget("question");
    }
  }

  function retry() {
    setAttempt(startAttempt(quiz));
    setAnnouncement("");
    setShareStatus("");
    setFocusTarget("question");
  }

  async function share(text: string) {
    const url = window.location.href.split("#")[0];
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: quiz.title, text, url });
      } catch {
        // Closed without sharing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus(labels.copied);
    } catch {
      setShareStatus("");
    }
  }

  return (
    <section aria-labelledby={titleId} className="border border-ink bg-white text-ink">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 lg:px-6">
        <span className="bg-lime px-2 py-0.5 font-mono text-xs font-bold tracking-label uppercase">
          {labels.kicker}
        </span>
        {!finished && (
          // Read with each question instead (see QuestionView).
          <span
            aria-hidden="true"
            className="font-mono text-sm font-bold"
            data-testid="quiz-progress"
          >
            {fillLabel(labels.progress, { current: attempt.current + 1, total })}
          </span>
        )}
      </div>

      <div className="px-4 pt-5 pb-6 lg:px-6 lg:pt-6 lg:pb-8">
        <h2 id={titleId} className="m-0 font-display text-xl leading-tight font-bold lg:text-2xl">
          {quiz.title}
        </h2>
        {quiz.description && (
          <p className="mt-2 mb-0 text-[15px] leading-normal text-muted">{quiz.description}</p>
        )}
        <div aria-hidden="true" className="mt-4 h-1 bg-line">
          <div
            className="h-full bg-accent transition-[width]"
            style={{ width: `${total === 0 ? 0 : (answered / total) * 100}%` }}
          />
        </div>

        {question && !finished && (
          <QuestionView
            key={question.id}
            question={question}
            chosenId={attempt.answers[question.id]}
            isLast={attempt.current === total - 1}
            readersCorrect={readersCorrect[question.id]}
            labels={labels}
            textId={questionTextId}
            progress={fillLabel(labels.progress, { current: attempt.current + 1, total })}
            questionRef={questionRef}
            feedbackRef={feedbackRef}
            onChoose={(option) => choose(question, option)}
            onNext={next}
          />
        )}

        {finished && (
          <Result
            points={score(quiz, attempt)}
            total={total}
            labels={labels}
            shareStatus={shareStatus}
            resultRef={resultRef}
            onRetry={retry}
            onShare={share}
          />
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

interface QuestionViewProps {
  question: QuizQuestion;
  chosenId: string | undefined;
  isLast: boolean;
  readersCorrect: number | undefined;
  labels: QuizLabels;
  textId: string;
  /** "3 / 10" for screen readers, with the question. */
  progress: string;
  questionRef: RefObject<HTMLDivElement | null>;
  feedbackRef: RefObject<HTMLDivElement | null>;
  onChoose: (option: QuizOption) => void;
  onNext: () => void;
}

function QuestionView({
  question,
  chosenId,
  isLast,
  readersCorrect,
  labels,
  textId,
  progress,
  questionRef,
  feedbackRef,
  onChoose,
  onNext,
}: QuestionViewProps) {
  const chosen = question.options.find((option) => option.id === chosenId);
  const correct = question.options.find((option) => option.isCorrect);

  return (
    <div ref={questionRef} tabIndex={-1} className="mt-6 outline-none">
      <p id={textId} className="m-0 text-lg leading-snug font-semibold lg:text-xl">
        <span className="sr-only">{progress}. </span>
        {question.text}
      </p>
      {question.imagePath && (
        <ResponsiveImage
          path={question.imagePath}
          alt={question.imageAlt}
          sizes="(min-width: 1024px) 700px, 100vw"
          className="mt-4 aspect-video w-full"
        />
      )}
      <ul aria-labelledby={textId} className="mt-4 mb-0 flex list-none flex-col gap-2 p-0">
        {question.options.map((option, index) => {
          const state = optionState(option, chosenId);
          return (
            <li key={option.id} className="m-0">
              <button
                type="button"
                disabled={Boolean(chosenId)}
                data-state={state}
                onClick={() => onChoose(option)}
                className={cx(
                  "flex min-h-11 w-full items-center gap-3 border px-3 py-2.5 text-left text-base leading-snug",
                  optionClasses[state],
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center border border-current font-mono text-xs"
                >
                  {LETTERS[index]}
                </span>
                <span className="flex-1">{option.text}</span>
                {state === "correct" && (
                  <span className="font-mono text-xs font-bold text-success uppercase">
                    {labels.correct}
                  </span>
                )}
                {state === "wrong" && (
                  <span className="font-mono text-xs font-bold text-danger uppercase">
                    {labels.wrong}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          data-testid="quiz-feedback"
          className="mt-5 border-t border-line pt-4 outline-none"
        >
          <p
            className={cx(
              "m-0 font-display text-lg font-bold",
              chosen.isCorrect ? "text-success" : "text-danger",
            )}
          >
            {chosen.isCorrect ? labels.correct : labels.wrong}
          </p>
          {!chosen.isCorrect && correct && (
            <p className="mt-1 mb-0 text-[15px]">
              {fillLabel(labels.correctAnswer, { answer: correct.text })}
            </p>
          )}
          {question.explanation && (
            <p className="mt-2 mb-0 text-[15px] leading-normal text-graphite">
              {question.explanation}
            </p>
          )}
          {readersCorrect !== undefined && (
            <p className="mt-2 mb-0 font-mono text-xs text-muted">
              {fillLabel(labels.readersCorrect, { percent: readersCorrect })}
            </p>
          )}
          <button
            type="button"
            onClick={onNext}
            className={buttonClasses({ variant: "ink", className: "mt-4" })}
          >
            {isLast ? labels.finish : labels.next}
          </button>
        </div>
      )}
    </div>
  );
}

interface ResultProps {
  points: number;
  total: number;
  labels: QuizLabels;
  shareStatus: string;
  resultRef: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
  onShare: (text: string) => void;
}

function Result({ points, total, labels, shareStatus, resultRef, onRetry, onShare }: ResultProps) {
  const shareText = fillLabel(labels.shareText, { score: points, total });
  return (
    <div ref={resultRef} tabIndex={-1} className="mt-6 outline-none" data-testid="quiz-result">
      <p className="m-0 font-display text-5xl leading-none font-extrabold">
        {fillLabel(labels.score, { score: points, total })}
      </p>
      <p className="mt-3 mb-0 text-base leading-normal">
        {labels.result[resultBand(points, total)]}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className={buttonClasses({ variant: "ink" })}>
          {labels.retry}
        </button>
        <button
          type="button"
          onClick={() => onShare(shareText)}
          aria-label={`${labels.shareLabel}: ${shareText}`}
          className={buttonClasses({ variant: "outline" })}
        >
          {shareText}
        </button>
      </div>
      {shareStatus && (
        <p role="status" className="mt-3 mb-0 text-sm">
          {shareStatus}
        </p>
      )}
    </div>
  );
}
