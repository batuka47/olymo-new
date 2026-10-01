import type { Metadata } from "next";
import { getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { articleTags, type Article } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { articleSocialImagePath, mediaUrl, SOCIAL_IMAGE_SIZE } from "@/lib/media";
import { siteOpenGraph } from "@/lib/metadata";

export function articleMetadata(article: Article, preview: boolean): Metadata {
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  const url = articlePath(article.category_slug, article.slug);
  // Cropped to 1200 × 630 from the cover when the cover is uploaded (see encodeCoverImage).
  const images = article.cover_path
    ? [
        {
          url: mediaUrl(articleSocialImagePath(article.id), article.updated_at),
          ...SOCIAL_IMAGE_SIZE,
          alt: article.cover_alt ?? "",
        },
      ]
    : undefined;

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
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
    robots: preview ? { index: false, follow: false } : undefined,
  };
}
