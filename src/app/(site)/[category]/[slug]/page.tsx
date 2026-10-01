import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/ui/container";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Tag } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import { getCategory, isCategorySlug } from "@/config/categories";
import { articlePath } from "@/lib/articles/status";
import { formatDate } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { OlympiadInfo, hasOlympiadInfo } from "./olympiad-info";

// Articles are rendered on first visit and then cached (ISR); see revalidate in (site)/layout.tsx.
export function generateStaticParams() {
  return [];
}

/**
 * Readers get the cookie-free public client (RLS: published and due only). In Draft Mode the
 * staff session is used instead, so drafts and scheduled articles render for preview.
 */
const getArticle = cache(async (slug: string, preview: boolean) => {
  const supabase = preview ? await createClient() : createPublicClient();
  const { data } = await supabase
    .from("articles")
    .select("*, article_tags(tags(slug, label))")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(slug, preview);
  if (!article) {
    return {};
  }

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: articlePath(article.category_slug, article.slug) },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: article.publish_at ?? undefined,
      images: article.cover_path
        ? [{ url: mediaUrl(article.cover_path), width: 1600, alt: article.cover_alt ?? "" }]
        : undefined,
    },
    robots: preview ? { index: false, follow: false } : undefined,
  };
}

export default async function ArticlePage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) {
    notFound();
  }

  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(slug, preview);
  if (!article) {
    notFound();
  }

  const path = articlePath(article.category_slug, article.slug);
  if (article.category_slug !== category) {
    // The category was changed after publishing: send old links to the current address.
    (preview ? redirect : permanentRedirect)(path);
  }

  const tags = article.article_tags.flatMap((link) => (link.tags ? [link.tags] : []));
  const meta = [article.author_name, article.publish_at && formatDate(article.publish_at)].filter(
    Boolean,
  );

  return (
    <>
      {preview && (
        <div role="status" className="bg-lime text-ink">
          <Container className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-2 text-sm">
            <span>{t("article.preview.banner")}</span>
            <a
              href={`${adminRoutes.previewExit}?path=${encodeURIComponent(path)}`}
              className="font-mono text-xs tracking-label uppercase underline underline-offset-4"
            >
              {t("article.preview.exit")}
            </a>
          </Container>
        </div>
      )}

      <article>
        <Container className="py-10 lg:py-14">
          <nav
            aria-label={t("article.breadcrumb")}
            className="font-mono text-xs tracking-label text-muted uppercase"
          >
            <Link href="/" className="hover:underline">
              {t("article.home")}
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/${article.category_slug}`} className="text-accent hover:underline">
              {getCategory(article.category_slug)?.label}
            </Link>
          </nav>
          <h1 className="mt-6 max-w-5xl font-display text-3xl leading-[1.1] font-bold tracking-display lg:text-[54px] lg:leading-[1.08]">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-6 max-w-3xl text-lg leading-relaxed lg:text-[21px]">
              {article.excerpt}
            </p>
          )}
          {meta.length > 0 && (
            <p className="mt-6 border-t border-line pt-5 font-mono text-xs text-muted">
              {meta.join(" · ")}
            </p>
          )}
        </Container>

        <Container className="grid gap-10 pb-16 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {article.cover_path && (
              <ResponsiveImage
                path={article.cover_path}
                version={article.updated_at}
                alt={article.cover_alt ?? ""}
                sizes="(min-width: 1440px) 860px, (min-width: 1024px) 62vw, 100vw"
                priority
                className="mb-8 aspect-video w-full object-cover"
              />
            )}
            {/* body_html is generated and sanitized on the server when the article is saved. */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.body_html ?? "" }}
            />
            {tags.length > 0 && (
              <ul
                aria-label={t("article.tags")}
                className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6"
              >
                {tags.map((tag) => (
                  <li key={tag.slug}>
                    <Tag>#{tag.label}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {hasOlympiadInfo(article) && (
            <aside className="lg:col-span-4">
              <OlympiadInfo article={article} />
            </aside>
          )}
        </Container>
      </article>
    </>
  );
}
