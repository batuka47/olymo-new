import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";
import { adminRoutes } from "@/config/admin";
import { t, type MessageKey } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t("admin.login.title") };

// /admin/auth/confirm sends people back here with ?error=<link type> when a link is invalid.
const linkErrors: Record<string, MessageKey> = {
  invite: "admin.login.inviteInvalid",
  recovery: "admin.login.recoveryInvalid",
};

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next, error } = await searchParams;
  const linkError = typeof error === "string" ? linkErrors[error] : undefined;

  return (
    <AuthCard title={t("admin.login.title")} intro={t("admin.login.intro")}>
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        initialError={linkError ? t(linkError) : undefined}
        labels={{
          email: t("admin.login.email"),
          password: t("admin.login.password"),
          submit: t("admin.login.submit"),
          submitting: t("admin.login.submitting"),
        }}
      />
      <Link
        href={adminRoutes.forgotPassword}
        className="mt-6 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        {t("admin.login.forgot")}
      </Link>
    </AuthCard>
  );
}
