import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { adminRoutes, isPublicAdminPath } from "@/config/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

/**
 * Refreshes the Supabase session cookie and keeps non-staff out of /admin.
 * This is a first line of defence only: pages and server actions check the role again.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Validates the access token and refreshes it when it has expired.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const { pathname } = request.nextUrl;
  const isStaff = userId ? await hasStaffRole(supabase, userId) : false;

  if (isPublicAdminPath(pathname)) {
    if (pathname === adminRoutes.login && isStaff) {
      return redirectKeepingCookies(request, response, adminRoutes.dashboard);
    }
    return response;
  }

  if (!isStaff) {
    const loginUrl = new URL(adminRoutes.login, request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectKeepingCookies(request, response, loginUrl);
  }
  return response;
}

async function hasStaffRole(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return isStaffRole(profile?.role);
}

function redirectKeepingCookies(request: NextRequest, source: NextResponse, target: string | URL) {
  const redirect = NextResponse.redirect(new URL(target, request.url));
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*"],
};
