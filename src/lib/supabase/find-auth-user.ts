import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

/**
 * Finds an auth user's id by email with the service-role client. The admin API has no lookup by
 * email, so this pages through users; fine for the rare admin actions that need it.
 */
export async function findAuthUserIdByEmail(
  serviceClient: Pick<SupabaseClient, "auth">,
  email: string,
): Promise<string | undefined> {
  const wanted = email.toLowerCase();

  for (let page = 1; ; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) {
      return undefined;
    }
    const match = data.users.find((user) => user.email?.toLowerCase() === wanted);
    if (match || data.users.length < PAGE_SIZE) {
      return match?.id;
    }
  }
}
