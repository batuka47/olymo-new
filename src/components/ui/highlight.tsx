/**
 * Matches the search terms where a word starts, ignoring case, the way the search's prefix match
 * finds them: "олимп" marks "Олимп" in "Олимпиадын". Terms are letters and digits only (see
 * searchTerms), so they need no escaping. The capture group keeps the matches in split().
 */
function termPattern(terms: readonly string[]): RegExp | null {
  if (terms.length === 0) {
    return null;
  }
  const longestFirst = [...terms].sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![\\p{L}\\p{N}])(${longestFirst.join("|")})`, "giu");
}

/** `text` with the search terms in lime <mark>s (search results). Plain text without terms. */
export function Highlight({ text, terms = [] }: { text: string; terms?: readonly string[] }) {
  const pattern = termPattern(terms);
  if (!pattern) {
    return text;
  }
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="bg-lime text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
