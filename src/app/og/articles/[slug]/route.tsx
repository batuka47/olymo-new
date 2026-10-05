import { getCategory } from "@/config/categories";
import { getArticle } from "@/lib/articles/public";
import { formatDate } from "@/lib/dates";
import { contentShareImage } from "@/lib/og/share-card";

/** Share image of a published article without a cover (see shareImageUrl). */
export async function GET(_request: Request, { params }: RouteContext<"/og/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug, false);
  if (!article) {
    return new Response(null, { status: 404 });
  }
  return contentShareImage({
    title: article.title,
    label: getCategory(article.category_slug)?.label ?? "",
    date: article.publish_at ? formatDate(article.publish_at) : undefined,
  });
}
