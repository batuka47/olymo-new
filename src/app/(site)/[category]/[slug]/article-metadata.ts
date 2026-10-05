import type { Metadata } from "next";
import { getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { articleTags, type Article } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";
import { noindex, pageRobots, siteOpenGraph } from "@/lib/metadata";
import { shareImageUrl } from "@/lib/og/share-image-url";

export function articleMetadata(article: Article, preview: boolean): Metadata {
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  const url = articlePath(article.category_slug, article.slug);
  // Cropped from the cover on upload (see encodeCoverImage), or drawn from the title without one.
  const images = [
    {
      url: shareImageUrl("articles", article),
      ...SOCIAL_IMAGE_SIZE,
      alt: (article.cover_path && article.cover_alt) || title,
    },
  ];

  return {
    title: { absolute: `${title} | ${siteConfig.name}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      ...siteOpenGraph,
      type: "article",
      url,
      title,
      description,
      images,
      publishedTime: article.publish_at ?? undefined,
      modifiedTime: article.updated_at,
      section: getCategory(article.category_slug)?.label,
      tags: articleTags(article).map((tag) => tag.label),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    robots: pageRobots(preview ? noindex : undefined),
  };
}
