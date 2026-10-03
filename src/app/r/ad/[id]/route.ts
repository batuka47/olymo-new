import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/server";

const notFound = () => new NextResponse("Not found", { status: 404 });

async function countClick(adId: string): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient().rpc("record_ad_click", { ad_id: adId });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Recording an ad click failed", error);
    return null;
  }
}

/** Without the count (it failed), a running ad's link is still readable with the public key. */
async function runningAdLink(adId: string): Promise<string | null> {
  const { data } = await createPublicClient()
    .from("ads")
    .select("link_url")
    .eq("id", adId)
    .maybeSingle();
  return data?.link_url ?? null;
}

/**
 * Ad links (from AdSlot only) come here: count the click, then send the reader to the advertiser.
 * Counting never blocks the reader.
 */
export async function GET(_request: Request, { params }: RouteContext<"/r/ad/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return notFound();
  }
  const link = (await countClick(id)) ?? (await runningAdLink(id));
  if (!link) {
    return notFound();
  }
  const response = NextResponse.redirect(link, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
