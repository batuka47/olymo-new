"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { fieldLabelClasses } from "@/components/ui/text-field";
import { adminRoutes } from "@/config/admin";
import { siteHost } from "@/config/site";
import { t } from "@/lib/i18n";
import { SOCIAL_IMAGE_SIZE } from "@/lib/media";

/** The card is redrawn this long after the last keystroke, not on every one. */
const REDRAW_DELAY_MS = 600;

interface SharePreviewProps {
  /** The cover; without one the site shares a card drawn from the title. */
  coverPath: string | null;
  /** Title and description the link preview shows under the image. */
  title: string;
  description: string;
  /** What the drawn card shows: the article title, its category (or event type) and date. */
  card: { title: string; label: string; date: string };
}

function cardUrl(card: SharePreviewProps["card"]): string {
  const query = new URLSearchParams({ title: card.title, label: card.label, date: card.date });
  return `${adminRoutes.sharePreview}?${query}`;
}

/** How a link to the page looks on Facebook, Messenger and X: the same image the site shares. */
export function SharePreview({ coverPath, title, description, card }: SharePreviewProps) {
  const url = cardUrl(card);
  const [shownUrl, setShownUrl] = useState(url);

  useEffect(() => {
    const timer = setTimeout(() => setShownUrl(url), REDRAW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className={fieldLabelClasses}>{t("admin.articles.seo.preview")}</figcaption>
      <div className="max-w-md border border-line bg-white">
        {coverPath ? (
          <ResponsiveImage
            path={coverPath}
            alt=""
            sizes="448px"
            className="aspect-[1.91/1] w-full"
          />
        ) : (
          <Image
            src={shownUrl}
            alt=""
            {...SOCIAL_IMAGE_SIZE}
            unoptimized
            className="aspect-[1.91/1] w-full bg-stone"
          />
        )}
        <div className="border-t border-line bg-paper px-3 py-2.5">
          <p className="text-xs text-muted uppercase">{siteHost()}</p>
          <p className="line-clamp-2 font-semibold">{title || "—"}</p>
          {description && <p className="line-clamp-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
    </figure>
  );
}
