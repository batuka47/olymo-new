import { redirect } from "next/navigation";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";

/**
 * A new event gets its id up front, so images can be uploaded into events/{id}/ before the first
 * save, and the editor keeps one stable URL (saves re-render the current page).
 */
export default async function NewEventPage() {
  await requireStaff();
  redirect(`${adminRoutes.events}/${crypto.randomUUID()}?new=1`);
}
