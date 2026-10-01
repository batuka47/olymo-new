"use client";

import { useEffect } from "react";
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

export function ViewBeacon({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (isFirstViewThisSession(articleId)) {
      recordArticleView(articleId).catch(() => {
        // A lost view is not worth bothering the reader about.
      });
    }
  }, [articleId]);

  return null;
}
