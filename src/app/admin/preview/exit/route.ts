import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/** Leaves Draft Mode and returns to the page (same-site paths only). */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();

  const path = request.nextUrl.searchParams.get("path");
  redirect(path?.startsWith("/") && !path.startsWith("//") ? path : "/");
}
