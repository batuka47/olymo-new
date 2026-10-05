import { LazyComments } from "@/components/site/comments/lazy-comments";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";

interface CommentsSectionProps {
  articleId: string;
  closed: boolean;
  /** The article's address; signing in to comment comes back to #comments. */
  path: string;
}

/** The #comments anchor and the design's 8 + 4 column split; the list loads in the browser. */
export function CommentsSection({ articleId, closed, path }: CommentsSectionProps) {
  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="border-t border-line lg:grid lg:grid-cols-12"
    >
      <div className="py-8 lg:col-span-8 lg:border-r lg:border-line lg:px-12 lg:py-10">
        <LazyComments
          articleId={articleId}
          closed={closed}
          returnTo={`${path}#comments`}
          placeholder={
            <div className="flex flex-col gap-5">
              <h2 id="comments-title" className="font-display text-[22px] font-bold lg:text-2xl">
                {t("comments.title")}
              </h2>
              <p role="status" className="flex items-center gap-2 text-sm text-muted">
                <Spinner /> {t("comments.loading")}
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
