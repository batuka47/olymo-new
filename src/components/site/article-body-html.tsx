import { useId } from "react";
import { BodyEnhancements, type BodyFeatures } from "@/components/site/body-enhancements";
import { t } from "@/lib/i18n";
import { quizLabels } from "@/lib/quizzes/labels";
import type { QuizData } from "@/lib/quizzes/model";
import { getActiveQuizzes } from "@/lib/quizzes/queries";

/** A quiz block as the sanitizer leaves it (the Quiz node in lib/editor/nodes.ts). */
const QUIZ_BLOCK = /<figure class="quiz" data-quiz="([0-9a-f-]{36})"><\/figure>/g;

/** Which interactive blocks the HTML contains (markers written by lib/editor/nodes.ts). */
function bodyFeatures(html: string, quizzes: QuizData[]): BodyFeatures | null {
  const features = {
    gallery: html.includes("data-gallery"),
    youtube: html.includes("data-youtube"),
    social: html.includes("data-social"),
    embed: html.includes('data-embed="sandbox"'),
    quiz: quizzes.length > 0,
  };
  return Object.values(features).some(Boolean) ? features : null;
}

/**
 * The text of an article, event or info page: body_html, built and sanitized on the server when
 * it was saved. Pages without sliders, videos, posts, embeds or quizzes load no script for them.
 * Quizzes are read now (they change without the article being saved); a block whose quiz was
 * deleted or switched off is left out.
 */
export async function ArticleBodyHtml({ html }: { html: string }) {
  const quizIds = [...html.matchAll(QUIZ_BLOCK)].map((match) => match[1]);
  const quizzes = await getActiveQuizzes(quizIds);
  const shown = new Set(quizzes.map((quiz) => quiz.id));
  const body =
    quizIds.length === 0
      ? html
      : html.replace(QUIZ_BLOCK, (block, id: string) => (shown.has(id) ? block : ""));

  return <BodyHtml html={body} quizzes={quizzes} />;
}

function BodyHtml({ html, quizzes }: { html: string; quizzes: QuizData[] }) {
  const bodyId = useId();
  const features = bodyFeatures(html, quizzes);

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
          quizzes={quizzes}
          quizLabels={features.quiz ? quizLabels() : null}
        />
      )}
    </>
  );
}
