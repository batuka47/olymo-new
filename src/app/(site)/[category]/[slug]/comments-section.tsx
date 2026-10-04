import { Comments } from "@/components/site/comments/comments";

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
        <Comments articleId={articleId} closed={closed} returnTo={`${path}#comments`} />
      </div>
    </section>
  );
}
