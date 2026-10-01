import Image from "next/image";
import { cx } from "@/lib/cx";
import { mediaUrl } from "@/lib/media";

interface ResponsiveImageProps {
  /** Media bucket path of the 1600 px variant. */
  path: string;
  alt: string;
  sizes: string;
  /** Changes when the file is replaced at the same path, to skip stale caches. */
  version?: string | number;
  /** Preload and load immediately (the LCP image of a page). Everything else is lazy. */
  preload?: boolean;
  /** Sizes the box, e.g. "aspect-video w-full"; the image covers it. */
  className?: string;
}

export function ResponsiveImage({
  path,
  alt,
  sizes,
  version,
  preload = false,
  className,
}: ResponsiveImageProps) {
  return (
    <div className={cx("relative overflow-hidden bg-stone", className)}>
      <Image
        src={mediaUrl(path, version)}
        alt={alt}
        sizes={sizes}
        fill
        preload={preload}
        className="object-cover"
      />
    </div>
  );
}
