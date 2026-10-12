"use client";

import { useEffect } from "react";
import type { GalleryLabels } from "@/lib/body-enhancers/gallery";
import type { QuizData, QuizLabels } from "@/lib/quizzes/model";

export interface BodyFeatures {
  gallery: boolean;
  youtube: boolean;
  social: boolean;
  embed: boolean;
  quiz: boolean;
}

interface BodyEnhancementsProps {
  /** id of the .article-body element the server rendered. */
  bodyId: string;
  features: BodyFeatures;
  labels: GalleryLabels & { youTubePlayer: string };
  /** The page's active quizzes, for its quiz blocks. */
  quizzes: QuizData[];
  quizLabels: QuizLabels | null;
}

/**
 * Brings the article's interactive blocks to life: slider arrows, YouTube on click, social posts
 * near the screen, sandboxed embeds growing to fit, quizzes. Each part loads only if the article has
 * it.
 */
export function BodyEnhancements({
  bodyId,
  features,
  labels,
  quizzes,
  quizLabels,
}: BodyEnhancementsProps) {
  useEffect(() => {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const cleanups: (() => void)[] = [];
    let active = true;
    const keep = (cleanup: () => void) => (active ? cleanups.push(cleanup) : cleanup());

    if (features.gallery) {
      void import("@/lib/body-enhancers/gallery").then(({ enhanceGallery }) => {
        body
          .querySelectorAll<HTMLElement>("figure[data-gallery]")
          .forEach((figure) => keep(enhanceGallery(figure, labels)));
      });
    }
    if (features.youtube) {
      void import("@/lib/body-enhancers/youtube").then(({ enhanceYouTube }) => {
        body
          .querySelectorAll<HTMLElement>("figure[data-youtube]")
          .forEach((figure) => keep(enhanceYouTube(figure, labels.youTubePlayer)));
      });
    }
    if (features.social) {
      void import("@/lib/body-enhancers/social").then(({ renderSocialPostsNearScreen }) =>
        keep(renderSocialPostsNearScreen(body)),
      );
    }
    if (features.embed) {
      void import("@/lib/body-enhancers/embed-frames").then(({ watchEmbedHeights }) =>
        keep(watchEmbedHeights(body)),
      );
    }
    if (features.quiz && quizLabels) {
      void import("@/lib/body-enhancers/quiz").then(({ mountQuizzes }) =>
        keep(mountQuizzes(body, quizzes, quizLabels)),
      );
    }

    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [bodyId, features, labels, quizzes, quizLabels]);

  return null;
}
