"use client";

import { SharePreview } from "@/components/admin/share-preview";
import { CharacterCount } from "@/components/ui/character-count";
import { TextField } from "@/components/ui/text-field";
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
  /** Category and date for the card drawn when there is no cover. */
  cardLabel: string;
  cardDate: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
}

export function SeoPanel({
  title,
  excerpt,
  seoTitle,
  seoDescription,
  coverPath,
  cardLabel,
  cardDate,
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

      <SharePreview
        coverPath={coverPath}
        title={shownTitle}
        description={shownDescription}
        card={{ title: title.trim(), label: cardLabel, date: cardDate }}
      />
    </div>
  );
}
