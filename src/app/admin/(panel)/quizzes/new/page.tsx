import { redirect } from "next/navigation";
import { adminRoutes } from "@/config/admin";
import { requireStaff } from "@/lib/auth/staff";

/**
 * A new quiz gets its id up front, so question images can be uploaded into quizzes/{id}/ before
 * the first save.
 */
export default async function NewQuizPage() {
  await requireStaff();
  redirect(`${adminRoutes.quizzes}/${crypto.randomUUID()}?new=1`);
}
