import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: t("admin.setPassword.title") };

export default async function SetPasswordPage() {
  await requireStaff();

  return (
    <>
      <AdminPageHeader title={t("admin.setPassword.title")} intro={t("admin.setPassword.intro")} />
      <SetPasswordForm
        labels={{
          password: t("admin.setPassword.password"),
          confirm: t("admin.setPassword.confirm"),
          submit: t("admin.setPassword.submit"),
          submitting: t("admin.setPassword.submitting"),
        }}
      />
    </>
  );
}
