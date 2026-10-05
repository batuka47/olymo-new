"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { CommentsProps } from "./comments";

const Comments = lazy(() => import("./comments").then((module) => ({ default: module.Comments })));

interface LazyCommentsProps extends CommentsProps {
  /** Shown until the comments' code has loaded: the heading and "loading". */
  placeholder: ReactNode;
}

/**
 * Downloads the comments, with Supabase's browser client, only when the section nears the screen,
 * so the article's first paint never waits for them.
 */
export function LazyComments({ placeholder, ...props }: LazyCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {near ? (
        <Suspense fallback={placeholder}>
          <Comments {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
