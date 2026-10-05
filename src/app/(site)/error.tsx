"use client";

import { LazyErrorScreen, type ErrorBoundaryProps } from "@/components/lazy-error-screen";
import { Container } from "@/components/ui/container";

/** A public page failed: the message sits inside the site's header and footer. */
export default function SiteError({ error, retry }: ErrorBoundaryProps) {
  return (
    <Container>
      <LazyErrorScreen error={error} retry={retry} />
    </Container>
  );
}
