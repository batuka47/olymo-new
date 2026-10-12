/** "Нүүр зургийн байрлал": over the title, under it (every older article), or beside it. */
export const COVER_POSITIONS = ["above", "below", "beside"] as const;
export type CoverPosition = (typeof COVER_POSITIONS)[number];

export function toCoverPosition(value: string | null | undefined): CoverPosition {
  return COVER_POSITIONS.includes(value as CoverPosition) ? (value as CoverPosition) : "below";
}
