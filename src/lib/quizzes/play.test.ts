import { describe, expect, it } from "vitest";
import type { QuizData } from "./model";
import {
  advance,
  answer,
  currentQuestion,
  isFinished,
  resultBand,
  score,
  shuffle,
  startAttempt,
} from "./play";

/** q1: a (correct) or b; q2: c or d (correct); q3: e (correct) or f. */
function quiz(orderMode: QuizData["orderMode"] = "fixed"): QuizData {
  const question = (id: string, correct: string, wrong: string) => ({
    id,
    text: id,
    imagePath: null,
    imageAlt: "",
    explanation: "",
    options: [
      { id: correct, text: correct, isCorrect: true },
      { id: wrong, text: wrong, isCorrect: false },
    ].sort((one, other) => one.id.localeCompare(other.id)),
  });
  return {
    id: "quiz",
    title: "Quiz",
    description: "",
    orderMode,
    questions: [question("q1", "a", "b"), question("q2", "d", "c"), question("q3", "e", "f")],
  };
}

/** A repeatable stand-in for Math.random. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe("shuffle", () => {
  it("keeps every item exactly once and leaves the input alone", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffle(items, seeded(7));
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("gives every order over many runs", () => {
    const random = seeded(42);
    const orders = new Set<string>();
    for (let run = 0; run < 600; run++) orders.add(shuffle(["a", "b", "c"], random).join(""));
    expect(orders.size).toBe(6);
  });
});

describe("startAttempt", () => {
  it("keeps the written order for a fixed quiz", () => {
    expect(startAttempt(quiz("fixed"), seeded(1)).order).toEqual(["q1", "q2", "q3"]);
  });

  it("shuffles the questions of a random quiz for each attempt", () => {
    const random = seeded(3);
    const orders = new Set(
      Array.from({ length: 20 }, () => startAttempt(quiz("random"), random).order.join()),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("answering and scoring", () => {
  it("scores right answers, locks answered questions and finishes after the last", () => {
    const data = quiz();
    let attempt = startAttempt(data);
    expect(currentQuestion(data, attempt)?.id).toBe("q1");

    attempt = answer(attempt, "q1", "a");
    attempt = answer(attempt, "q1", "b"); // locked: the first answer stays
    expect(attempt.answers.q1).toBe("a");
    attempt = advance(attempt);
    expect(advance(attempt)).toBe(attempt); // q2 is not answered yet

    attempt = advance(answer(attempt, "q2", "c"));
    attempt = advance(answer(attempt, "q3", "e"));
    expect(isFinished(attempt)).toBe(true);
    expect(score(data, attempt)).toBe(2);
  });

  it("says something fitting about the score", () => {
    expect(resultBand(10, 10)).toBe("perfect");
    expect(resultBand(7, 10)).toBe("good");
    expect(resultBand(4, 10)).toBe("fair");
    expect(resultBand(1, 10)).toBe("low");
    expect(resultBand(0, 0)).toBe("low");
  });
});
