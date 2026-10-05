"use client";

import { lazy, Suspense, useSyncExternalStore } from "react";

const AccountMenu = lazy(() =>
  import("./account-menu").then((module) => ({ default: module.AccountMenu })),
);

/**
 * Supabase keeps the session in sb-{project}-auth-token (.0, .1 when split); the
 * …-auth-token-code-verifier cookie of a pending sign-in is not a session.
 */
const SESSION_COOKIE = /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/;

function subscribeToFocus(onChange: () => void) {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
}

/**
 * The account menu, with Supabase's browser client, loads only when there is a session cookie, so
 * visitors without an account download none of it. Checked again when the tab gets focus, after
 * signing in in another tab.
 */
export function AccountMenuLoader() {
  const hasSession = useSyncExternalStore(
    subscribeToFocus,
    () => SESSION_COOKIE.test(document.cookie),
    () => false,
  );
  if (!hasSession) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <AccountMenu />
    </Suspense>
  );
}
