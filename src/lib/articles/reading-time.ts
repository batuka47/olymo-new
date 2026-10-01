const WORDS_PER_MINUTE = 200;

/** Minutes needed to read the article body at about 200 words a minute; at least 1. */
export function readingMinutes(bodyHtml: string | null): number {
  const text = (bodyHtml ?? "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
