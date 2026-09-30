import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

/**
 * Session-aware client for Server Components, Server Actions and Route Handlers.
 * Reading cookies makes the route dynamic, so use it only where the signed-in user matters
 * (admin, comments). Public ISR pages should use createPublicClient().
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies; the session is refreshed where they can be.
        }
      },
    },
  });
}

/**
 * Anonymous client without cookies for public, statically rendered pages (ISR).
 * It sees exactly what RLS allows the anon role to see.
 */
export function createPublicClient() {
  const { url, publishableKey } = getSupabaseConfig();

  return createSupabaseClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
