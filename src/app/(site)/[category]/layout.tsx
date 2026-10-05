import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/lib/metadata";
import { findListCategory } from "./category-list";

/**
 * An unknown category answers 404 here, before loading.tsx streams anything (after that the
 * status code is already sent). Covers articles too: /about/x is no category either.
 */
export async function generateMetadata({ params }: LayoutProps<"/[category]">): Promise<Metadata> {
  return findListCategory((await params).category) ? {} : notFoundMetadata;
}

export default async function CategoryLayout({ children, params }: LayoutProps<"/[category]">) {
  if (!findListCategory((await params).category)) {
    notFound();
  }
  return children;
}
