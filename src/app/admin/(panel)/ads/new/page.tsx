import { redirect } from "next/navigation";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";

/** A new ad gets its id up front, so its images can be uploaded into ads/{id}/ before saving. */
export default async function NewAdPage() {
  await requireStaff();
  redirect(`${adminRoutes.ads}/${crypto.randomUUID()}?new=1`);
}
