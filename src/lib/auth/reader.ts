import { routes } from "@/config/navigation";

/**
 * A path on this site to send a reader back to, or the home page. Never another site ("//x",
 * "https://x") and never the admin, so a crafted sign-in link cannot redirect anywhere else.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return routes.home;
  }
  if (value.startsWith("/\\") || value === "/admin" || value.startsWith("/admin/")) {
    return routes.home;
  }
  return value.slice(0, 500);
}

/** The sign-in page, remembering where to come back to. */
export function loginHref(returnTo: string): string {
  return `${routes.login}?next=${encodeURIComponent(returnTo)}`;
}

/** profiles.display_name allows 80 characters. */
export const DISPLAY_NAME_MAX = 80;
