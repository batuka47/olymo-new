import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";

export const metadata = { title: t("notFound.title") };

// Addresses under /admin that match no page land here, so they get the admin 404 (with the menu)
// instead of the site's.
export default function MissingAdminPage() {
  notFound();
}
