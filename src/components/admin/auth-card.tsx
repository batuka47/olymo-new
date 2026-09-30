import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

interface AuthCardProps {
  title: string;
  intro: string;
  children: ReactNode;
}

/** Centered card for the signed-out admin pages (login, forgot password). */
export function AuthCard({ title, intro, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-ink bg-paper p-6 lg:p-10">
        <Logo />
        <h1 className="mt-8 font-display text-2xl font-bold tracking-display">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{intro}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
