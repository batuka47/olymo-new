import { fillTokens } from "@/lib/site-pages/text";

interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * schema.org FAQPage data for search engines, as a string safe to put inside a <script> element
 * ("<" is escaped, so text from the database cannot close the tag).
 */
export function faqJsonLd(items: FaqEntry[]): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: fillTokens(item.question),
      acceptedAnswer: { "@type": "Answer", text: fillTokens(item.answer) },
    })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
