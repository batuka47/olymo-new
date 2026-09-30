"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/ui/form-message";
import { adminRoutes } from "@/config/admin";
import { staffRoles, type StaffRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/staff";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByEmail } from "@/lib/supabase/find-auth-user";
import { createClient } from "@/lib/supabase/server";

const roleSchema = z.enum(staffRoles);

const inviteSchema = z.object({
  email: z.email({ error: () => t("admin.validation.email") }),
  role: roleSchema,
});

const changeRoleSchema = z.object({ userId: z.uuid(), role: roleSchema });

const removeSchema = z.object({ userId: z.uuid() });

/**
 * Role changes run through the admin's own session, so RLS and the profiles_guard_role trigger
 * enforce "admins only" in the database as well.
 */
async function setProfileRole(
  userId: string,
  role: StaffRole | "reader",
  { onlyCurrentStaff }: { onlyCurrentStaff: boolean },
): Promise<boolean> {
  const supabase = await createClient();
  let update = supabase.from("profiles").update({ role }).eq("id", userId);
  if (onlyCurrentStaff) {
    update = update.in("role", staffRoles);
  }
  const { data, error } = await update.select("id");
  return !error && data.length > 0;
}

export async function inviteStaff(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const { email, role } = parsed.data;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
  let userId = data.user?.id;
  const alreadyRegistered = error?.code === "email_exists" || error?.code === "user_already_exists";

  if (error?.code === "over_email_send_rate_limit") {
    return { error: t("admin.users.emailRateLimit") };
  }
  if (error && !alreadyRegistered) {
    return { error: t("admin.users.inviteFailed") };
  }
  if (alreadyRegistered) {
    userId = await findAuthUserIdByEmail(adminClient, email);
  }
  if (!userId || !(await setProfileRole(userId, role, { onlyCurrentStaff: false }))) {
    return { error: t("admin.users.inviteFailed") };
  }

  revalidatePath(adminRoutes.users);
  return { success: alreadyRegistered ? t("admin.users.promoted") : t("admin.users.invited") };
}

export async function changeStaffRole(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: t("admin.users.failed") };
  }
  if (parsed.data.userId === admin.id) {
    return { error: t("admin.users.cannotChangeSelf") };
  }
  if (!(await setProfileRole(parsed.data.userId, parsed.data.role, { onlyCurrentStaff: true }))) {
    return { error: t("admin.users.notFound") };
  }

  revalidatePath(adminRoutes.users);
  return { success: t("admin.users.roleSaved") };
}

export async function removeStaff(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = removeSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return { error: t("admin.users.failed") };
  }
  if (parsed.data.userId === admin.id) {
    return { error: t("admin.users.cannotChangeSelf") };
  }
  if (!(await setProfileRole(parsed.data.userId, "reader", { onlyCurrentStaff: true }))) {
    return { error: t("admin.users.notFound") };
  }

  revalidatePath(adminRoutes.users);
  return { success: t("admin.users.removed") };
}
