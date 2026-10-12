import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { noindex } from "@/lib/metadata";

// Shared by the login page and the signed-in panel; the sidebar lives in (panel)/layout.tsx.
export const metadata: Metadata = {
  title: { default: t("admin.title"), template: `%s — ${t("admin.title")}` },
  robots: noindex,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
