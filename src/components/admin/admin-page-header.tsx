interface AdminPageHeaderProps {
  title: string;
  intro?: string;
}

export function AdminPageHeader({ title, intro }: AdminPageHeaderProps) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      <h1 className="font-display text-2xl font-bold tracking-display lg:text-3xl">{title}</h1>
      {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>}
    </header>
  );
}
