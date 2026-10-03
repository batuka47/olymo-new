"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { recordAdImpression } from "@/lib/ads/actions";

/** Share of the ad that has to be on screen before it counts as seen (the usual 50 % rule). */
const VISIBLE_SHARE = 0.5;

/** Counts one impression per page view, the first time the ad is half visible. */
export function AdImpression({ adId, children }: { adId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= VISIBLE_SHARE)) {
          observer.disconnect();
          recordAdImpression(adId).catch(() => {
            // A lost impression is not worth bothering the reader about.
          });
        }
      },
      { threshold: VISIBLE_SHARE },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [adId]);

  return <div ref={ref}>{children}</div>;
}
