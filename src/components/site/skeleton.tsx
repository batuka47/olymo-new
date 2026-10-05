import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

// Loading states (loading.tsx) drawn with the page's own grid: grey bars where text will be and
// the striped image placeholder where pictures will be. Nothing moves or spins.

/** A line of text that has not arrived yet; size it like the text it stands for. */
export function SkeletonText({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("block bg-stone", className)} />;
}

/** An image that has not arrived yet: the site's striped placeholder. */
export function SkeletonImage({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("block stripe-pattern", className)} />;
}

/** A card in an article grid: image, two title lines, a date. */
export function SkeletonCard() {
  return (
    <div className="flex gap-3.5 py-3.5 md:flex-col md:p-6">
      <SkeletonImage className="size-23 shrink-0 md:aspect-video md:h-auto md:w-full" />
      <div className="flex flex-1 flex-col gap-2.5">
        <SkeletonText className="h-3 w-20" />
        <SkeletonText className="h-4.5 w-full" />
        <SkeletonText className="h-4.5 w-3/4" />
        <SkeletonText className="mt-1 h-3 w-24" />
      </div>
    </div>
  );
}

/** Cards in the columns of ArticleGrid. */
export function SkeletonGrid({ count, columns = 3 }: { count: number; columns?: 3 | 4 }) {
  return (
    <div className="overflow-hidden border-t border-line">
      <div
        className={cx(
          "-mr-px -mb-px grid md:grid-cols-2",
          columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="border-r border-b border-line">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The page frame with the lines of the grid; screen readers hear "loading" once. */
export function SkeletonPage({ children }: { children: ReactNode }) {
  return (
    <Container className="pb-16 lg:pb-24" aria-busy="true">
      <p role="status" className="sr-only">
        {t("loading.label")}
      </p>
      <div className="border-b border-line lg:border-x">{children}</div>
    </Container>
  );
}
