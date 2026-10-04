import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MINUTE_MS = 60_000;

/** Public forms: 5 per IP an hour, counted from the stored submissions. */
const SUBMISSIONS = { max: 5, windowMinutes: 60 };

/** Sign-in, password reset and email sign-in links: 10 per IP in 15 minutes, each on its own. */
const AUTH_ATTEMPTS = { max: 10, windowMinutes: 15 };

export type AuthAction = "login" | "forgot_password" | "magic_link";

export async function canSubmitForm(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - SUBMISSIONS.windowMinutes * MINUTE_MS).toISOString();
  const { count, error } = await createAdminClient()
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (error) {
    throw error;
  }
  return (count ?? 0) < SUBMISSIONS.max;
}

/** Records the attempt; false once this address has gone over the limit. */
export async function recordAuthAttempt(action: AuthAction, ipHash: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("record_auth_attempt", {
    attempt_action: action,
    attempt_ip_hash: ipHash,
    window_minutes: AUTH_ATTEMPTS.windowMinutes,
  });
  if (error) {
    throw error;
  }
  return data <= AUTH_ATTEMPTS.max;
}
