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
