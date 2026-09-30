"use server";

import { redirect } from "next/navigation";
import { adminRoutes } from "@/config/admin";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(adminRoutes.login);
}
