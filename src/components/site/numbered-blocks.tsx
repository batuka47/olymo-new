import { filledBlocks, type TitledText } from "@/lib/site-pages/blocks";
import { paragraphs, fillTokens } from "@/lib/site-pages/text";

/** "01 Одоо / 02 Жилийн дараа / …": numbered boxes in a row on wide screens, stacked on phones. */
export function NumberedBlocks({ blocks }: { blocks: TitledText[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filledBlocks(blocks).map((block, index) => (
        <li key={index} className="flex flex-col gap-3 border border-line p-5 lg:p-6">
          <span className="font-mono text-xs text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          {block.title && (
            <h3 className="font-display text-lg leading-tight font-bold lg:text-xl">
              {fillTokens(block.title)}
            </h3>
          )}
          {paragraphs(fillTokens(block.text)).map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-graphite">
              {paragraph}
            </p>
          ))}
        </li>
      ))}
    </ol>
  );
}
