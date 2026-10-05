import type { Metadata } from "next";
import { SignInPanel } from "@/components/site/sign-in-panel";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/navigation";
import { safeReturnPath } from "@/lib/auth/reader";
import { t, type MessageKey } from "@/lib/i18n";
import { noindex } from "@/lib/metadata";

export const metadata: Metadata = {
  title: t("signIn.title"),
  alternates: { canonical: routes.login },
  robots: noindex,
};

const errors: Record<string, MessageKey> = {
  link: "signIn.errors.link",
  google: "signIn.errors.google",
};

/** Readers sign in here to comment (staff use /admin/login). ?next= is where they return. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const errorKey = typeof error === "string" ? errors[error] : undefined;

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-md flex-col gap-8 border border-ink bg-paper p-6 lg:p-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-bold tracking-display">{t("signIn.title")}</h1>
          <p className="text-[15px] leading-relaxed text-graphite">{t("signIn.intro")}</p>
        </div>
        <SignInPanel
          returnTo={safeReturnPath(next)}
          initialError={errorKey ? t(errorKey) : undefined}
        />
      </div>
    </Container>
  );
}
