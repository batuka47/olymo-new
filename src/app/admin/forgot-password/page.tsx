import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: t("admin.forgotPassword.title") };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title={t("admin.forgotPassword.title")} intro={t("admin.forgotPassword.intro")}>
      <ForgotPasswordForm
        labels={{
          email: t("admin.forgotPassword.email"),
          submit: t("admin.forgotPassword.submit"),
          submitting: t("admin.forgotPassword.submitting"),
        }}
      />
      <Link
        href={adminRoutes.login}
        className="mt-6 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        <span aria-hidden="true">←&nbsp;</span>
        {t("admin.forgotPassword.backToLogin")}
      </Link>
    </AuthCard>
  );
}
