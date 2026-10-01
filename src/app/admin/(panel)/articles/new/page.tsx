import { redirect } from "next/navigation";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";

/**
 * A new article gets its id up front, so images can be uploaded into articles/{id}/ before the
 * first save, and the editor keeps one stable URL (saves re-render the current page).
 */
export default async function NewArticlePage() {
  await requireStaff();
  redirect(`${adminRoutes.articles}/${crypto.randomUUID()}?new=1`);
}
