import { CopyLinkButton, NativeShareButton } from "@/components/site/share-actions";
import { buttonClasses } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface ShareButtonsProps {
  /** Absolute URL of the page. */
  url: string;
  title: string;
  /** Needed for Facebook's send dialog; without it Messenger is offered on phones only. */
  facebookAppId: string;
}

/**
 * Touch screens (pointer: coarse) get the share sheet and the Messenger app; computers a label and
 * Facebook's send dialog. CSS picks between them, so the row never changes after loading.
 */
export function ShareButtons({ url, title, facebookAppId }: ShareButtonsProps) {
  const link = encodeURIComponent(url);
  const appId = facebookAppId ? `&app_id=${facebookAppId}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1.5 font-mono text-[11px] tracking-label text-muted uppercase pointer-coarse:hidden">
        {t("article.share.label")}
      </span>
      <NativeShareButton
        url={url}
        title={title}
        label={t("article.share.native")}
        className="pointer-fine:hidden"
      />
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${link}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "ink" })}
      >
        {t("article.share.facebook")}
      </a>
      <a
        href={`fb-messenger://share/?link=${link}${appId}`}
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "outline", className: "pointer-fine:hidden" })}
      >
        {t("article.share.messenger")}
      </a>
      {facebookAppId && (
        <a
          href={`https://www.facebook.com/dialog/send?app_id=${facebookAppId}&link=${link}&redirect_uri=${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "outline", className: "pointer-coarse:hidden" })}
        >
          {t("article.share.messenger")}
        </a>
      )}
      <CopyLinkButton
        url={url}
        labels={{
          idle: t("article.share.copy"),
          copied: t("article.share.copied"),
          failed: t("article.share.copyFailed"),
          copiedStatus: t("article.share.copiedStatus"),
        }}
      />
    </div>
  );
}
