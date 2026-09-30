// Creates the first admin account (or promotes an existing account to admin).
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' npx tsx scripts/create-admin.ts
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from the environment, falling back to
// .env.local. Variables already set in the shell win, so the same script works for the hosted
// project by setting those two variables to the hosted values.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { findAuthUserIdByEmail } from "../src/lib/supabase/find-auth-user";
import type { Database } from "../src/lib/supabase/types";

const MIN_PASSWORD_LENGTH = 8;

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

async function createAdmin() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }

  const email = readEnv("ADMIN_EMAIL").toLowerCase();
  const password = readEnv("ADMIN_PASSWORD");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const supabase = createClient<Database>(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = data.user?.id;
  if (error) {
    if (error.code !== "email_exists") {
      throw new Error(`Could not create the user: ${error.message}`);
    }
    userId = await findAuthUserIdByEmail(supabase, email);
    console.log(`${email} already exists; its password is left unchanged.`);
  }
  if (!userId) {
    throw new Error(`Could not find the user ${email}.`);
  }

  // The service role has no auth.uid(), so the profiles_guard_role trigger allows this change.
  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (roleError) {
    throw new Error(`Could not grant the admin role: ${roleError.message}`);
  }

  console.log(`✓ ${email} is an admin. Sign in at /admin/login.`);
}

createAdmin().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
