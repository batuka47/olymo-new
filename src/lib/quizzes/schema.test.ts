import { describe, expect, it } from "vitest";
import { quizInputSchema, toSaveQuizPayload, type QuizInput } from "./schema";

const QUIZ_ID = "6f1c2b9e-1d3a-4c55-8e0f-0a1b2c3d4e5f";
let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

function question(
  correct: number[] = [0],
  options = ["А", "Б", "В"],
): QuizInput["questions"][number] {
  return {
    id: id(),
    text: "Монгол улсын нийслэл?",
    imagePath: null,
    imageAlt: "",
    explanation: "Улаанбаатар 1639 оноос.",
    options: options.map((text, index) => ({ id: id(), text, isCorrect: correct.includes(index) })),
  };
}

function quiz(questions = [question(), question([2])]): QuizInput {
  return {
    id: QUIZ_ID,
    title: "Газарзүй",
    description: "",
    orderMode: "fixed",
    isActive: true,
    questions,
  };
}

const firstError = (input: QuizInput) => quizInputSchema.safeParse(input).error?.issues[0]?.message;

describe("quizInputSchema", () => {
  it("accepts a quiz with one correct option per question", () => {
    expect(quizInputSchema.safeParse(quiz()).success).toBe(true);
  });

  it("names the question without exactly one correct option", () => {
    expect(firstError(quiz([question(), question([])]))).toContain("2-р асуулт");
    expect(firstError(quiz([question([0, 1])]))).toContain("1-р асуулт");
  });

  it("wants at least two filled-in options, a question text and a title", () => {
    expect(firstError(quiz([question([0], ["А"])]))).toContain("2 хариулт");
    expect(firstError(quiz([question([0], ["А", " "])]))).toContain("хоосон хариулт");
    expect(firstError(quiz([{ ...question(), text: "  " }]))).toContain("текстийг");
    expect(firstError({ ...quiz(), title: "" })).toBeDefined();
    expect(firstError(quiz([]))).toBeDefined();
  });

  it("takes images only from the quiz's own folder, with alt text", () => {
    const own = `quizzes/${QUIZ_ID}/question-ab12cd34-1600.webp`;
    expect(
      firstError(quiz([{ ...question(), imagePath: own, imageAlt: "Газрын зураг" }])),
    ).toBeUndefined();
    expect(firstError(quiz([{ ...question(), imagePath: own, imageAlt: "" }]))).toContain("alt");
    expect(
      firstError(quiz([{ ...question(), imagePath: "articles/x/cover-1600.webp", imageAlt: "x" }])),
    ).toContain("зураг");
  });
});

describe("toSaveQuizPayload", () => {
  it("numbers questions and options in the order they are shown", () => {
    const parsed = quizInputSchema.parse(quiz());
    const payload = toSaveQuizPayload(parsed);
    expect(payload.questions.map((item) => item.sort_order)).toEqual([1, 2]);
    expect(
      payload.questions[1].options.map((option) => [option.sort_order, option.is_correct]),
    ).toEqual([
      [1, false],
      [2, false],
      [3, true],
    ]);
    expect(payload.questions[0].image_alt).toBeNull();
  });
});
