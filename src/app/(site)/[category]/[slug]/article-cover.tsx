import { ResponsiveImage } from "@/components/ui/responsive-image";
import type { Article } from "@/lib/articles/public";
import { cx } from "@/lib/cx";

interface ArticleCoverProps {
  article: Article;
  /** How wide the image is drawn, for the browser to pick a file (see ResponsiveImage). */
  sizes: string;
  className?: string;
  imageClassName?: string;
}

/** The cover with its caption; the page's largest image, so it loads first. */
export function ArticleCover({ article, sizes, className, imageClassName }: ArticleCoverProps) {
  if (!article.cover_path) {
    return null;
  }
  return (
    <figure className={className}>
      <ResponsiveImage
        path={article.cover_path}
        alt={article.cover_alt ?? ""}
        sizes={sizes}
        preload
        className={cx("aspect-video w-full", imageClassName)}
      />
      {article.cover_caption && (
        <figcaption className="mt-2.5 caption">{article.cover_caption}</figcaption>
      )}
    </figure>
  );
}
