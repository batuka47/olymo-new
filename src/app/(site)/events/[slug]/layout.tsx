import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { getEvent } from "@/lib/events/queries";
import { notFoundMetadata } from "@/lib/metadata";

/** A missing event's 404 page gets the 404 title (a page's own metadata is dropped on notFound). */
export async function generateMetadata({
  params,
}: LayoutProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  return (await getEvent(slug, preview)) ? {} : notFoundMetadata;
}

export default function EventLayout({ children }: LayoutProps<"/events/[slug]">) {
  return children;
}
