"use client";

import { CharacterCount } from "@/components/ui/character-count";
import { TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { t } from "@/lib/i18n";

// Lengths search engines and Facebook usually show without cutting.
const TITLE_RECOMMENDED = 60;
const DESCRIPTION_RECOMMENDED = 160;

interface SeoPanelProps {
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
}

/** Optional search and share wording; the card beside "Богино тайлбар" shows the result. */
export function SeoPanel({
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: SeoPanelProps) {
  const recommended = t("admin.articles.seo.recommended");

  return (
    <div className="grid gap-4 xl:grid-cols-2">
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
      <p className="text-xs text-muted xl:col-span-2">{t("admin.articles.seo.hint")}</p>
    </div>
  );
}
