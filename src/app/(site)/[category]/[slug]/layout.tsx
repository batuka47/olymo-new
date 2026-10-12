import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getArticle } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { notFoundMetadata } from "@/lib/metadata";

/**
 * Checks the article before loading.tsx starts streaming the page: once it has, the status code
 * is sent, and a missing article could no longer answer 404 nor a wrong category 308. The page
 * reads the same article again from React's per-request cache.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/[category]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  return (await getArticle(slug, preview)) ? {} : notFoundMetadata;
}

export default async function ArticleLayout({
  children,
  params,
}: LayoutProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(slug, preview);
  if (!article) {
    notFound();
  }
  if (article.category_slug !== category) {
    // Wrong or outdated category in the link (it was changed after publishing): 308 to the right one.
    (preview ? redirect : permanentRedirect)(articlePath(article.category_slug, article.slug));
  }
  return children;
}
