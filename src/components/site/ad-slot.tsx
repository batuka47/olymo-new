import { getImageProps } from "next/image";
import { AdImpression } from "@/components/site/ad-impression";
import { adFormat, type AdPlacement } from "@/config/ads";
import { getRunningAds, pickAd } from "@/lib/ads/queries";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

/** A full-width ad between page sections: a line above and room around it. */
export const adBandClasses = "border-t border-line py-6 lg:p-8";

/** Under Tailwind's sm breakpoint phones get the mobile image, when there is one. */
const MOBILE_MEDIA = "(max-width: 639px)";

interface AdSlotProps {
  placement: AdPlacement;
  /** Spacing and lines around the ad; they disappear with it when there is no ad. */
  className?: string;
}

/**
 * One running ad for the placement (at random when several share it), or nothing at all. Clicks go
 * through /r/ad/[id], which counts them; AdImpression counts views.
 */
export async function AdSlot({ placement, className }: AdSlotProps) {
  const ad = pickAd(await getRunningAds(placement));
  if (!ad) {
    return null;
  }

  const format = adFormat(placement);
  const { props: desktop } = getImageProps({
    src: mediaUrl(ad.image_path, ad.updated_at),
    alt: ad.title,
    width: format.desktop.width,
    height: format.desktop.height,
    sizes: format.sizes,
  });
  const mobileSrcSet =
    format.mobile && ad.image_path_mobile
      ? getImageProps({
          src: mediaUrl(ad.image_path_mobile, ad.updated_at),
          alt: ad.title,
          width: format.mobile.width,
          height: format.mobile.height,
          sizes: "100vw",
        }).props.srcSet
      : undefined;

  return (
    <div className={className}>
      <p className="mb-2 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
        {t("ads.label")}
      </p>
      <AdImpression adId={ad.id}>
        <a href={`/r/ad/${ad.id}`} target="_blank" rel="sponsored noopener" className="block">
          <picture>
            {mobileSrcSet && <source media={MOBILE_MEDIA} srcSet={mobileSrcSet} sizes="100vw" />}
            {/* The recommended proportions are kept, so a wrongly sized image is cropped, not stretched. */}
            <img
              {...desktop}
              alt={ad.title}
              className={cx(
                "w-full bg-stone object-cover",
                format.mobile ? "aspect-1248/140" : "aspect-300/250",
                mobileSrcSet && "max-sm:aspect-358/100",
              )}
            />
          </picture>
        </a>
      </AdImpression>
    </div>
  );
}
