import { fillTokens } from "@/lib/site-pages/text";

interface FaqEntry {
  question: string;
  answer: string;
}

/** schema.org FAQPage data for search engines; render it with <JsonLd>. */
export function faqJsonLd(items: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: fillTokens(item.question),
      acceptedAnswer: { "@type": "Answer", text: fillTokens(item.answer) },
    })),
  };
}
