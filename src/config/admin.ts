import type { MessageKey } from "@/lib/i18n";

export const adminRoutes = {
  dashboard: "/admin",
  login: "/admin/login",
  forgotPassword: "/admin/forgot-password",
  confirm: "/admin/auth/confirm",
  setPassword: "/admin/set-password",
  articles: "/admin/articles",
  preview: "/admin/preview",
  previewExit: "/admin/preview/exit",
  events: "/admin/events",
  ads: "/admin/ads",
  pages: "/admin/pages",
  inbox: "/admin/inbox",
  comments: "/admin/comments",
  users: "/admin/users",
} as const;

/** Admin paths reachable without a staff session. */
const publicAdminPaths: readonly string[] = [
  adminRoutes.login,
  adminRoutes.forgotPassword,
  adminRoutes.confirm,
];

export function isPublicAdminPath(pathname: string): boolean {
  return publicAdminPaths.includes(pathname);
}

/** Only same-site admin paths are allowed as a post-login destination (no open redirects). */
export function safeAdminRedirect(path: string | null | undefined): string {
  const isAdminPath =
    path === adminRoutes.dashboard || path?.startsWith(`${adminRoutes.dashboard}/`);
  if (!path || !isAdminPath || path.startsWith("//") || isPublicAdminPath(path)) {
    return adminRoutes.dashboard;
  }
  return path;
}

export interface AdminNavItem {
  href: string;
  labelKey: MessageKey;
  adminOnly?: boolean;
  /** Shows the number of new form submissions next to the link. */
  newSubmissionsBadge?: boolean;
}

export const adminNavItems: readonly AdminNavItem[] = [
  { href: adminRoutes.dashboard, labelKey: "admin.nav.dashboard" },
  { href: adminRoutes.articles, labelKey: "admin.nav.articles" },
  { href: adminRoutes.events, labelKey: "admin.nav.events" },
  { href: adminRoutes.ads, labelKey: "admin.nav.ads" },
  { href: adminRoutes.pages, labelKey: "admin.nav.pages" },
  // Submissions are readable only by admins (RLS), so editors do not see the section.
  {
    href: adminRoutes.inbox,
    labelKey: "admin.nav.inbox",
    adminOnly: true,
    newSubmissionsBadge: true,
  },
  { href: adminRoutes.comments, labelKey: "admin.nav.comments" },
  { href: adminRoutes.users, labelKey: "admin.nav.users", adminOnly: true },
];
