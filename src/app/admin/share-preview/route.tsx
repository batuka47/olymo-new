import { getStaffUser } from "@/lib/auth/staff";
import { formatDate } from "@/lib/dates";
import { contentShareImage } from "@/lib/og/share-card";

/** Enough for any title: the card itself shortens long ones. */
const TEXT_MAX = 300;

/**
 * The share card an article or event without a cover gets, drawn from what the editor shows now
 * (saved or not), for the share preview in the editors. Staff only.
 */
export async function GET(request: Request) {
  if (!(await getStaffUser())) {
    return new Response(null, { status: 401 });
  }
  const query = new URL(request.url).searchParams;
  const text = (name: string) => (query.get(name) ?? "").slice(0, TEXT_MAX);
  return contentShareImage(
    // Not published yet: the date it would get today.
    { title: text("title"), label: text("label"), date: text("date") || formatDate(new Date()) },
    "private, no-store",
  );
}
