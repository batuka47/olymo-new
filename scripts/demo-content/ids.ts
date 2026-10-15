// Every demo row gets an id starting with DEMO_ID_PREFIX, so `npm run demo:clear` can find all of
// them (and their image folders) without touching anything else.

const DEMO_ID_PREFIX = "de000000-0000-4000-8000-";

const KIND_DIGITS = {
  article: 1,
  event: 2,
  ad: 3,
  quiz: 4,
  question: 5,
  option: 6,
  reader: 7,
  comment: 8,
  team: 9,
} as const;

export type DemoKind = keyof typeof KIND_DIGITS;

export function demoId(kind: DemoKind, index: number): string {
  return `${DEMO_ID_PREFIX}${KIND_DIGITS[kind]}${String(index).padStart(11, "0")}`;
}

export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}

/** Every demo id sorts between these two, for range filters. */
export const DEMO_ID_RANGE = {
  first: `${DEMO_ID_PREFIX}000000000000`,
  last: `${DEMO_ID_PREFIX}ffffffffffff`,
} as const;
