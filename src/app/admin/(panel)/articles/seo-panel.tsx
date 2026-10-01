"use client";

import { CharacterCount } from "@/components/ui/character-count";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { t } from "@/lib/i18n";

// Lengths search engines and Facebook usually show without cutting.
const TITLE_RECOMMENDED = 60;
const DESCRIPTION_RECOMMENDED = 160;

interface SeoPanelProps {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  coverPath: string | null;
  coverVersion: string;
  siteHost: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
}

export function SeoPanel({
  title,
  excerpt,
  seoTitle,
  seoDescription,
  coverPath,
  coverVersion,
  siteHost,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: SeoPanelProps) {
  const shownTitle = seoTitle.trim() || title.trim();
  const shownDescription = seoDescription.trim() || excerpt.trim();
  const recommended = t("admin.articles.seo.recommended");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-4">
        <TextField
          label={t("admin.articles.seo.seoTitle")}
          name="seoTitle"
          value={seoTitle}
          maxLength={120}
          onChange={(event) => onSeoTitleChange(event.target.value)}
          hint={<CharacterCount value={seoTitle} limit={TITLE_RECOMMENDED} label={recommended} />}
        />
        <TextAreaField
          label={t("admin.articles.seo.seoDescription")}
          name="seoDescription"
          value={seoDescription}
          maxLength={300}
          rows={3}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          hint={
            <CharacterCount
              value={seoDescription}
              limit={DESCRIPTION_RECOMMENDED}
              label={recommended}
            />
          }
        />
        <p className="text-xs text-muted">{t("admin.articles.seo.hint")}</p>
      </div>

      <figure className="flex flex-col gap-2">
        <figcaption className={fieldLabelClasses}>{t("admin.articles.seo.preview")}</figcaption>
        <div className="max-w-md border border-line bg-white">
          {coverPath ? (
            <ResponsiveImage
              path={coverPath}
              version={coverVersion}
              alt=""
              sizes="448px"
              className="aspect-[1.91/1] w-full object-cover"
            />
          ) : (
            <div className="aspect-[1.91/1] w-full stripe-pattern" />
          )}
          <div className="border-t border-line bg-paper px-3 py-2.5">
            <p className="text-xs text-muted uppercase">{siteHost}</p>
            <p className="line-clamp-2 font-semibold">{shownTitle || "—"}</p>
            {shownDescription && (
              <p className="line-clamp-1 text-sm text-muted">{shownDescription}</p>
            )}
          </div>
        </div>
      </figure>
    </div>
  );
}
