// Two demo quizzes, placed in the olympiad and the science showcase articles.
import type { QuizOrderMode, QuizQuestion } from "../../src/lib/quizzes/model";
import { demoId } from "./ids";

export interface DemoQuiz {
  id: string;
  title: string;
  description: string;
  orderMode: QuizOrderMode;
  questions: QuizQuestion[];
}

interface QuestionDraft {
  text: string;
  options: string[];
  /** Position of the correct option in `options`. */
  correct: number;
  explanation: string;
}

let questionCount = 0;

function question({ text, options, correct, explanation }: QuestionDraft): QuizQuestion {
  questionCount += 1;
  const number = questionCount;
  return {
    id: demoId("question", number),
    text,
    imagePath: null,
    imageAlt: "",
    explanation,
    options: options.map((option, index) => ({
      id: demoId("option", number * 10 + index),
      text: option,
      isCorrect: index === correct,
    })),
  };
}

export const mathQuiz: DemoQuiz = {
  id: demoId("quiz", 1),
  title: "Математикийн сорил: олимпиадад бэлэн үү?",
  description: "Таван асуулт, хариулт бүрийн дараа тайлбартай.",
  orderMode: "fixed",
  questions: [
    question({
      text: "Тэгш өнцөгт гурвалжны катетууд 3 ба 4 см бол гипотенуз хэдэн см вэ?",
      options: ["5 см", "6 см", "7 см", "12 см"],
      correct: 0,
      explanation: "Пифагорын теоремоор 3² + 4² = 9 + 16 = 25, √25 = 5.",
    }),
    question({
      text: "Аль нь анхны тоо вэ?",
      options: ["21", "27", "29", "33"],
      correct: 2,
      explanation: "29 зөвхөн 1 болон өөртөө хуваагдана. 21 = 3·7, 27 = 3·9, 33 = 3·11.",
    }),
    question({
      text: "1-ээс 100 хүртэлх натурал тоонуудын нийлбэр хэд вэ?",
      options: ["5000", "5050", "5100", "10100"],
      correct: 1,
      explanation: "Гауссын аргаар: (1 + 100) · 100 / 2 = 5050.",
    }),
    question({
      text: "Тойргийн радиусыг 2 дахин ихэсгэвэл талбай нь хэд дахин ихсэх вэ?",
      options: ["2 дахин", "3 дахин", "4 дахин", "8 дахин"],
      correct: 2,
      explanation: "S = πr², тиймээс радиус 2 дахин ихсэхэд талбай 2² = 4 дахин ихэснэ.",
    }),
    question({
      text: "x + 2x + 3x = 36 бол x хэд вэ?",
      options: ["4", "6", "9", "12"],
      correct: 1,
      explanation: "6x = 36 тул x = 6.",
    }),
  ],
};

export const scienceQuiz: DemoQuiz = {
  id: demoId("quiz", 2),
  title: "Шинжлэх ухааны сорил",
  description: "Дөрвөн асуулт, асуултын дараалал оролдлого бүрт өөрчлөгдөнө.",
  orderMode: "random",
  questions: [
    question({
      text: "Усны химийн томьёо аль нь вэ?",
      options: ["H₂O", "CO₂", "O₂", "NaCl"],
      correct: 0,
      explanation: "Усны молекул хоёр устөрөгч, нэг хүчилтөрөгчийн атомаас тогтоно.",
    }),
    question({
      text: "Гэрэл вакуумд нэг секундэд ойролцоогоор хэдэн км зам туулах вэ?",
      options: ["30 000 км", "150 000 км", "300 000 км", "3 000 000 км"],
      correct: 2,
      explanation: "Гэрлийн хурд вакуумд 299 792 км/с буюу ойролцоогоор 300 000 км/с.",
    }),
    question({
      text: "Нарны аймгийн хамгийн том гариг аль вэ?",
      options: ["Ангараг", "Санчир", "Бархасбадь", "Дэлхий"],
      correct: 2,
      explanation: "Бархасбадь бол Нарны аймгийн хамгийн том, хамгийн их масстай гариг.",
    }),
    question({
      text: "Фотосинтезийн явцад ургамал юу ялгаруулдаг вэ?",
      options: ["Азот", "Хүчилтөрөгч", "Метан", "Нүүрсхүчлийн хий"],
      correct: 1,
      explanation:
        "Ургамал нарны гэрлийн энергиэр нүүрсхүчлийн хий, уснаас глюкоз үүсгэж, хүчилтөрөгч ялгаруулдаг.",
    }),
  ],
};

export const demoQuizzes = [mathQuiz, scienceQuiz];
