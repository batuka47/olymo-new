// Mongolian Cyrillic → Latin, as commonly used in Mongolian URLs (х → kh, ө → o, ү → u).
const cyrillicToLatin: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e", // "ye" at the start of a word, see transliterate()
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

const LETTER = /\p{L}/u;

export function transliterate(text: string): string {
  const chars = [...text.toLowerCase()];
  return chars
    .map((char, index) => {
      // е is "ye" at the start of a word (Ерөнхий → yeronkhii), "e" after a letter (Математик → matematik).
      if (char === "е" && !LETTER.test(chars[index - 1] ?? "")) {
        return "ye";
      }
      return cyrillicToLatin[char] ?? char;
    })
    .join("");
}

/** "Математикийн олимпиад 2026!" → "matematikiin-olimpiad-2026" */
export function slugify(text: string): string {
  const slug = transliterate(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length <= MAX_SLUG_LENGTH) {
    return slug;
  }
  const cut = slug.slice(0, MAX_SLUG_LENGTH);
  return cut.slice(0, cut.lastIndexOf("-") > 0 ? cut.lastIndexOf("-") : MAX_SLUG_LENGTH);
}
