import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { adminRoutes } from "@/config/admin";
import { createClient } from "@/lib/supabase/server";

const linkTypes = ["invite", "recovery"] as const;
type LinkType = (typeof linkTypes)[number];

function isLinkType(value: string | null): value is LinkType {
  return linkTypes.some((type) => type === value);
}

/**
 * Target of the staff invite and password reset emails (supabase/templates/invite.html and
 * recovery.html). Exchanges the one-time token for a session cookie, then sends the person to
 * choose a new password.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && isLinkType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(adminRoutes.setPassword);
    }
  }

  redirect(`${adminRoutes.login}?error=${type === "recovery" ? "recovery" : "invite"}`);
}
