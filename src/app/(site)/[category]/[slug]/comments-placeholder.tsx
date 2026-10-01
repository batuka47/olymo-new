import { t } from "@/lib/i18n";

/** Where comments go (step 14). Keeps the #comments anchor and the design's 8 + 4 column split. */
export function CommentsPlaceholder() {
  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="border-t border-line lg:grid lg:grid-cols-12"
    >
      <div className="py-8 lg:col-span-8 lg:border-r lg:border-line lg:px-12 lg:py-10">
        <h2 id="comments-title" className="font-display text-[22px] font-bold lg:text-2xl">
          {t("article.comments.title")}
        </h2>
        <p className="mt-3 text-[15px] text-muted">{t("article.comments.soon")}</p>
      </div>
    </section>
  );
}
