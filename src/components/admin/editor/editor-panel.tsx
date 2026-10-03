import type { ReactNode } from "react";

/** A titled box in the article and event editors. */
export function EditorPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
