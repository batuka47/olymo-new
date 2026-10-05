import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { AdSlot } from "@/components/site/ad-slot";
import { PreviewBanner } from "@/components/site/preview-banner";
import { TagLinks } from "@/components/site/tag-links";
import { Container } from "@/components/ui/container";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { siteConfig } from "@/config/site";
import { articleBreadcrumbJsonLd, articleJsonLd } from "@/lib/articles/json-ld";
import {
  articleTags,
  getArticle,
  getLatestArticlePaths,
  getMostReadArticles,
  getRelatedArticles,
  type Article,
} from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { ArticleHeader } from "./article-header";
import { articleMetadata } from "./article-metadata";
import { CommentsSection } from "./comments-section";
import { hasKeyFacts, KeyFacts } from "./key-facts";
import { MostRead } from "./most-read";
import { RelatedArticles } from "./related-articles";
import { ViewBeacon } from "./view-beacon";

export const revalidate = 60;

const PRERENDERED_ARTICLES = 50;

export async function generateStaticParams() {
  const articles = await getLatestArticlePaths(PRERENDERED_ARTICLES);
  return articles.map((article) => ({ category: article.category_slug, slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(slug, preview);
  return article ? articleMetadata(article, preview) : {};
}

function ArticleBody({ article }: { article: Article }) {
  const tags = articleTags(article);
  return (
    <>
      {article.cover_path && (
        <figure className="mb-8">
          <ResponsiveImage
            path={article.cover_path}
            alt={article.cover_alt ?? ""}
            sizes="(min-width: 1024px) 780px, 100vw"
            preload
            className="aspect-video w-full"
          />
          {article.cover_caption && (
            <figcaption className="mt-2.5 caption">{article.cover_caption}</figcaption>
          )}
        </figure>
      )}
      {/* body_html is generated and sanitized on the server when the article is saved. */}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body_html ?? "" }} />
      {tags.length > 0 && (
        <TagLinks
          tags={tags}
          label={t("article.tags")}
          className="mt-10 flex flex-wrap gap-2 border-t border-line pt-4"
        />
      )}
    </>
  );
}

export default async function ArticlePage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle(slug, preview);
  if (!article) {
    notFound();
  }

  const path = articlePath(article.category_slug, article.slug);
  if (article.category_slug !== category) {
    // Wrong or outdated category in the link (it was changed after publishing): 308 to the right one.
    (preview ? redirect : permanentRedirect)(path);
  }

  const [mostRead, related] = await Promise.all([
    getMostReadArticles(article.id),
    getRelatedArticles(article),
  ]);
  const showKeyFacts = hasKeyFacts(article);

  return (
    <>
      {preview ? <PreviewBanner path={path} /> : <ViewBeacon articleId={article.id} />}
      <JsonLd data={articleJsonLd(article, `${siteConfig.url}${path}`)} />
      <JsonLd data={articleBreadcrumbJsonLd(article)} />

      <Container className="pb-16 lg:pb-24">
        <div className="border-b border-line lg:border-x">
          <article>
            <ArticleHeader article={article} path={path} />

            {/* One column on phones (key facts, body, aside); 8 + 4 columns from lg. */}
            <div className="grid border-t border-line lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
              {showKeyFacts && (
                <aside
                  aria-labelledby="key-facts-title"
                  className="pt-8 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:px-8 lg:pt-10"
                >
                  <KeyFacts article={article} />
                </aside>
              )}
              <div className="min-w-0 py-8 lg:col-span-8 lg:row-span-2 lg:row-start-1 lg:border-r lg:border-line lg:px-12 lg:pt-10 lg:pb-14">
                <ArticleBody article={article} />
              </div>
              <aside
                className={cx(
                  "flex flex-col gap-7 border-t border-line py-8 lg:col-span-4 lg:col-start-9 lg:border-t-0 lg:px-8 lg:pb-10",
                  showKeyFacts ? "lg:row-start-2 lg:pt-7" : "lg:row-start-1 lg:pt-10",
                )}
              >
                <AdSlot placement="article_side" />
                {mostRead.length > 0 && <MostRead articles={mostRead} />}
              </aside>
            </div>
          </article>

          <CommentsSection articleId={article.id} closed={article.comments_closed} path={path} />
          {related.length > 0 && <RelatedArticles articles={related} />}
        </div>
      </Container>
    </>
  );
}
