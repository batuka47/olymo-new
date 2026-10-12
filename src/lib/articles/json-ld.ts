import { categoryPath, type Category } from "@/config/categories";
import { routes } from "@/config/navigation";
import { articleTags, type Article } from "@/lib/articles/public";
import { t } from "@/lib/i18n";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/json-ld";
import { shareImageUrl } from "@/lib/og/share-image-url";

/** schema.org NewsArticle; articles without a byline are credited to the site. */
export function articleJsonLd(article: Article, category: Category | undefined, pageUrl: string) {
  const publisher = organizationJsonLd();
  const tags = articleTags(article).map((tag) => tag.label);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    url: pageUrl,
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: [shareImageUrl("articles", article)],
    datePublished: article.publish_at ?? undefined,
    dateModified: article.updated_at,
    author: article.author_name ? { "@type": "Person", name: article.author_name } : publisher,
    publisher,
    articleSection: category?.label,
    keywords: tags.length > 0 ? tags.join(", ") : undefined,
    inLanguage: "mn",
  };
}

/** Нүүр › category › article, as in the page's breadcrumb (a hidden category has no page). */
export function articleBreadcrumbJsonLd(article: Article, category: Category | undefined) {
  return breadcrumbJsonLd([
    { name: t("article.home"), path: routes.home },
    ...(category?.is_active ? [{ name: category.label, path: categoryPath(category.slug) }] : []),
    { name: article.title },
  ]);
}
