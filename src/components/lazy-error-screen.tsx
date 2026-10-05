"use client";

import { lazy, Suspense } from "react";
import type { ErrorScreenProps } from "@/components/error-screen";

// Error boundaries are part of every page's JavaScript; the screen and its text load on demand.
const ErrorScreen = lazy(() => import("@/components/error-screen"));

/** What Next.js passes to every error.tsx. */
export type ErrorBoundaryProps = Pick<ErrorScreenProps, "error" | "retry">;

export function LazyErrorScreen(props: ErrorScreenProps) {
  return (
    <Suspense fallback={null}>
      <ErrorScreen {...props} />
    </Suspense>
  );
}
