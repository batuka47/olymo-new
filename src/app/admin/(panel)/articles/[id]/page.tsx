import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { articleRowToValues, emptyArticleValues } from "@/lib/articles/form";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { ArticleEditor } from "../article-editor";
import { getArticleForEditing, getAvailableTags, siteHost } from "../data";

export async function generateMetadata({
  searchParams,
}: PageProps<"/admin/articles/[id]">): Promise<Metadata> {
  const { new: isNew } = await searchParams;
  return { title: t(isNew ? "admin.articles.editor.newTitle" : "admin.articles.editor.editTitle") };
}

export default async function EditArticlePage({
  params,
  searchParams,
}: PageProps<"/admin/articles/[id]">) {
  await requireStaff();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const [article, availableTags] = await Promise.all([
    getArticleForEditing(id),
    getAvailableTags(),
  ]);
  // ?new=1 comes from /admin/articles/new: the article is created on its first save.
  if (!article && !isNew) {
    notFound();
  }

  return (
    <ArticleEditor
      key={id}
      articleId={id}
      initialValues={article ? articleRowToValues(article.row, article.tags) : emptyArticleValues()}
      saved={
        article
          ? {
              exists: true,
              status: article.row.status,
              publishAt: article.row.publish_at,
              slug: article.row.slug,
              categorySlug: article.row.category_slug,
            }
          : { exists: false, status: "draft", publishAt: null, slug: "", categorySlug: "" }
      }
      availableTags={availableTags}
      siteHost={siteHost()}
    />
  );
}
