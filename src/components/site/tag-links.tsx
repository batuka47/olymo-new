import Link from "next/link";
import { tagSearchHref } from "@/lib/search/params";

interface TagLinksProps {
  tags: readonly { slug: string; label: string }[];
  label: string;
  className?: string;
}

/** "#Тэтгэлэг" chips that open the tag's articles on /search (under articles, on /search). */
export function TagLinks({ tags, label, className }: TagLinksProps) {
  return (
    <ul aria-label={label} className={className}>
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link
            href={tagSearchHref(tag.slug)}
            className="inline-flex min-h-11 items-center border border-ink px-3 font-mono text-xs tracking-wider uppercase hover:bg-ink hover:text-paper"
          >
            #{tag.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
