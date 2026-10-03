import type { ReactNode } from "react";

interface EditorBarProps {
  title: string;
  /** Next to the title: state badge, save status. */
  status: ReactNode;
  actions: ReactNode;
}

/** The sticky bar on top of an editor (articles, events, site pages). */
export function EditorBar({ title, status, actions }: EditorBarProps) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {status}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  );
}
