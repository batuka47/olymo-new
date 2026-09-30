"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

const passwordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH, { error: () => t("admin.setPassword.tooShort") }),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    error: () => t("admin.setPassword.mismatch"),
  });

export async function setPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();

  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") return { error: t("admin.setPassword.weak") };
    if (error.code === "same_password") return { error: t("admin.setPassword.same") };
    return { error: t("admin.setPassword.failed") };
  }

  redirect(adminRoutes.dashboard);
}
