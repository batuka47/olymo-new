import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminRoutes } from "@/config/admin";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export interface StaffUser {
  id: string;
  email: string;
  role: StaffRole;
}

/**
 * The signed-in staff member for this request, or null. The role is read from the database on
 * every request, so a role change takes effect immediately. Cached per request.
 */
export const getStaffUser = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!isStaffRole(profile?.role)) {
    return null;
  }
  return { id: claims.sub, email: claims.email ?? "", role: profile.role };
});

export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaffUser();
  if (!staff) {
    redirect(adminRoutes.login);
  }
  return staff;
}

export async function requireAdmin(): Promise<StaffUser> {
  const staff = await requireStaff();
  if (staff.role !== "admin") {
    redirect(adminRoutes.dashboard);
  }
  return staff;
}
