"use client";

import { LazyErrorScreen, type ErrorBoundaryProps } from "@/components/lazy-error-screen";
import { Container } from "@/components/ui/container";
import { jetbrainsMono, onest, unbounded } from "@/lib/fonts";
import "./globals.css";

/** The root layout itself failed: this replaces it, so it brings its own document and styles. */
export default function GlobalError({ error, retry }: ErrorBoundaryProps) {
  return (
    <html
      lang="mn"
      className={`${unbounded.variable} ${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Container as="section" className="flex-1">
          <LazyErrorScreen error={error} retry={retry} />
        </Container>
      </body>
    </html>
  );
}
