import { fillTokens, paragraphs } from "@/lib/site-pages/text";

interface FaqListProps {
  items: { id: string; question: string; answer: string }[];
}

/**
 * Native <details>/<summary>: keyboard and screen readers work without JavaScript, and the
 * browser's find-in-page opens the answer it finds.
 */
export function FaqList({ items }: FaqListProps) {
  return (
    <div className="border-b border-line">
      {items.map((item) => (
        <details key={item.id} className="group border-t border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] leading-snug font-semibold hover:text-accent lg:text-lg [&::-webkit-details-marker]:hidden">
            {fillTokens(item.question)}
            <span
              aria-hidden="true"
              className="shrink-0 font-mono text-2xl leading-none text-accent transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="flex flex-col gap-3 pb-6 text-[17px] leading-relaxed text-graphite">
            {paragraphs(fillTokens(item.answer)).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
