/** Same values as the articles.subject check constraint. */
export const olympiadSubjects = [
  "math",
  "physics",
  "chemistry",
  "informatics",
  "biology",
  "other",
] as const;

export type OlympiadSubject = (typeof olympiadSubjects)[number];

export function isOlympiadSubject(value: string | null): value is OlympiadSubject {
  return olympiadSubjects.some((subject) => subject === value);
}

export type DeadlineStatus = "open" | "soon" | "closed";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Deadlines less than this many days away are highlighted in lime (design system rule). */
const SOON_DAYS = 7;

/** A registration deadline is a date; registration stays open to the end of that day in Ulaanbaatar. */
export function deadlineStatus(deadline: string, now = new Date()): DeadlineStatus {
  const msLeft = new Date(`${deadline}T23:59:59.999+08:00`).getTime() - now.getTime();
  if (msLeft < 0) {
    return "closed";
  }
  return msLeft < SOON_DAYS * DAY_MS ? "soon" : "open";
}

/** Large symbol on olympiad cards (the home page scroller). */
export const subjectGlyphs: Record<OlympiadSubject, string> = {
  math: "∑",
  physics: "λ",
  chemistry: "H₂O",
  informatics: "{ }",
  biology: "DNA",
  other: "?",
};
