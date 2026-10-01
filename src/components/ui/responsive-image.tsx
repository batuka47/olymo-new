import { responsiveImageSources } from "@/lib/media";

interface ResponsiveImageProps {
  /** Media bucket path of the 1600 px variant. */
  path: string;
  alt: string;
  sizes: string;
  /** Changes when the file is replaced at the same path, to skip stale caches. */
  version?: string | number;
  /** Load immediately (the LCP image of a page). Everything else is lazy. */
  priority?: boolean;
  className?: string;
}

export function ResponsiveImage({
  path,
  alt,
  sizes,
  version,
  priority = false,
  className,
}: ResponsiveImageProps) {
  const { src, srcSet } = responsiveImageSources(path, version);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the files are already resized WebP variants
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
