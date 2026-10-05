"use client";

import { useEffect } from "react";
import { runWhenIdle } from "@/lib/run-when-idle";
import { recordArticleView } from "./actions";

/** True the first time this browser session asks; storage is per tab session and never sent. */
function isFirstViewThisSession(articleId: string): boolean {
  const key = `viewed:${articleId}`;
  try {
    if (sessionStorage.getItem(key)) {
      return false;
    }
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage is blocked (some private modes): count the view rather than lose it.
  }
  return true;
}

/** Counts the view once the article has loaded, so the request never delays the page itself. */
export function ViewBeacon({ articleId }: { articleId: string }) {
  useEffect(
    () =>
      runWhenIdle(() => {
        if (isFirstViewThisSession(articleId)) {
          recordArticleView(articleId).catch(() => {
            // A lost view is not worth bothering the reader about.
          });
        }
      }),
    [articleId],
  );

  return null;
}
