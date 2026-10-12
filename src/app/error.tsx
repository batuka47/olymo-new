"use client";

import { LazyErrorScreen, type ErrorBoundaryProps } from "@/components/lazy-error-screen";
import { Container } from "@/components/ui/container";

/** Errors above the page layouts (the site's header and footer themselves, the admin sign-in). */
export default function RootError({ error, retry }: ErrorBoundaryProps) {
  return (
    <Container as="section" className="flex-1">
      <LazyErrorScreen error={error} retry={retry} />
    </Container>
  );
}
