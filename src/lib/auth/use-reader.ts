"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Reader {
  id: string;
  email: string;
  displayName: string;
  banned: boolean;
}

export type ReaderState =
  { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; reader: Reader };

async function loadReader(): Promise<ReaderState> {
  const supabase = createClient();
  // The session is read from the cookie in the browser: enough for what the page shows. Every
  // write goes through a server action, which checks the session with the auth server.
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    return { status: "signed-out" };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, banned")
    .eq("id", user.id)
    .maybeSingle();
  return {
    status: "signed-in",
    reader: {
      id: user.id,
      email: user.email ?? "",
      displayName: profile?.display_name || user.email?.split("@")[0] || "",
      banned: profile?.banned ?? false,
    },
  };
}

/**
 * The signed-in reader, loaded in the browser so the pages around it stay cacheable. Follows
 * sign-in and sign-out in this and other tabs.
 */
export function useReader(): ReaderState {
  const [state, setState] = useState<ReaderState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const refresh = () =>
      void loadReader().then((next) => {
        if (active) setState(next);
      });
    refresh();
    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Supabase calls made inside this callback can deadlock it, so the reload waits a tick.
        setTimeout(refresh, 0);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
