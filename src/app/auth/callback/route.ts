import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { routes } from "@/config/navigation";
import { safeReturnPath } from "@/lib/auth/reader";
import { createClient } from "@/lib/supabase/server";

/**
 * Where readers land after Google (?code=, PKCE) or the emailed sign-in link (?token_hash=, which
 * works in any browser). Turns either into a session cookie and goes to ?next=, the page the
 * reader came from; safeReturnPath keeps it on this site.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const returnTo = safeReturnPath(params.get("next"));

  const supabase = await createClient();
  let signedIn = false;
  if (code) {
    signedIn = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash) {
    signedIn = !(await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash })).error;
  }

  if (!signedIn) {
    redirect(`${routes.login}?error=link&next=${encodeURIComponent(returnTo)}`);
  }
  redirect(returnTo);
}
