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
  // Kazakh and Ukrainian letters that turn up in names, so no title loses a letter.
  ә: "a",
  ғ: "g",
  қ: "k",
  ң: "ng",
  ұ: "u",
  һ: "h",
  і: "i",
  ї: "yi",
  є: "ye",
  ґ: "g",
};

/** The link of an article whose title has no Latin or Cyrillic letters or digits ("медээ"). */
export const FALLBACK_SLUG = "medee";

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

/** The automatic link for a title: never empty while there is a title, never anything but a-z, 0-9, -. */
export function slugFromTitle(title: string): string {
  return slugify(title) || (title.trim() ? FALLBACK_SLUG : "");
}
