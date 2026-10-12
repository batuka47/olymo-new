import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findListCategory } from "@/lib/categories/queries";
import { notFoundMetadata } from "@/lib/metadata";

/**
 * An unknown or hidden category answers 404 here, before loading.tsx streams anything (after that
 * the status code is already sent). Articles check their own address in [slug]/layout.tsx, so one
 * filed under a deleted category still redirects to where it is now.
 */
export async function generateMetadata({ params }: LayoutProps<"/[category]">): Promise<Metadata> {
  return (await findListCategory((await params).category)) ? {} : notFoundMetadata;
}

export default async function CategoryListLayout({ children, params }: LayoutProps<"/[category]">) {
  if (!(await findListCategory((await params).category))) {
    notFound();
  }
  return children;
}
