import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/lib/metadata";

export const metadata = notFoundMetadata;

// Deeper addresses (/olympiad/some-article/x, /a/b/c) match no page. Ending here gives them the
// site's 404 with its header and footer instead of the bare root one.
export default function MissingPage() {
  notFound();
}
