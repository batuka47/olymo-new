import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  intro?: string;
  /** Buttons shown on the right, e.g. "+ Шинэ мэдээ". */
  actions?: ReactNode;
}

export function AdminPageHeader({ title, intro, actions }: AdminPageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-display lg:text-3xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>}
      </div>
      {actions}
    </header>
  );
}
