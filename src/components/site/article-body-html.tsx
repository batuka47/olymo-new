import { useId } from "react";
import { BodyEnhancements, type BodyFeatures } from "@/components/site/body-enhancements";
import { t } from "@/lib/i18n";

/** Which interactive blocks the HTML contains (markers written by lib/editor/nodes.ts). */
function bodyFeatures(html: string): BodyFeatures | null {
  const features = {
    gallery: html.includes("data-gallery"),
    youtube: html.includes("data-youtube"),
    social: html.includes("data-social"),
    embed: html.includes('data-embed="sandbox"'),
  };
  return Object.values(features).some(Boolean) ? features : null;
}

/**
 * The text of an article, event or info page: body_html, built and sanitized on the server when
 * it was saved. Pages without sliders, videos, posts or embeds load no script for them.
 */
export function ArticleBodyHtml({ html }: { html: string }) {
  const bodyId = useId();
  const features = bodyFeatures(html);

  return (
    <>
      <div id={bodyId} className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      {features && (
        <BodyEnhancements
          bodyId={bodyId}
          features={features}
          labels={{
            previous: t("editor.gallery.previous"),
            next: t("editor.gallery.next"),
            youTubePlayer: t("editor.youtube.play"),
          }}
        />
      )}
    </>
  );
}
