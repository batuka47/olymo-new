"use client";

import { LazyErrorScreen, type ErrorBoundaryProps } from "@/components/lazy-error-screen";

/** An admin page failed: the message sits inside the admin menu; "home" is the dashboard. */
export default function AdminError({ error, retry }: ErrorBoundaryProps) {
  return <LazyErrorScreen error={error} retry={retry} area="admin" />;
}
