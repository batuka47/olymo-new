"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface ShareButtonsProps {
  /** Absolute URL of the page. */
  url: string;
  title: string;
  /** Needed for Facebook's send dialog; without it Messenger is offered on phones only. */
  facebookAppId: string;
}

type CopyState = "idle" | "copied" | "failed";

const TOUCH_QUERY = "(pointer: coarse)";
const COPY_FEEDBACK_MS = 2000;

function subscribeToTouch(onChange: () => void) {
  const query = window.matchMedia(TOUCH_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeToNothing() {
  return () => {};
}

/** Phones and tablets. The server renders the desktop buttons; phones switch after hydration. */
function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    subscribeToTouch,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );
}

function useCanShareNatively(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );
}

function messengerUrl(url: string, facebookAppId: string, touch: boolean): string | null {
  const link = encodeURIComponent(url);
  if (touch) {
    return `fb-messenger://share/?link=${link}${facebookAppId ? `&app_id=${facebookAppId}` : ""}`;
  }
  if (!facebookAppId) {
    return null;
  }
  return `https://www.facebook.com/dialog/send?app_id=${facebookAppId}&link=${link}&redirect_uri=${link}`;
}

export function ShareButtons({ url, title, facebookAppId }: ShareButtonsProps) {
  const touch = useIsTouchDevice();
  const canShareNatively = useCanShareNatively();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
  }

  async function shareNatively() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Closing the share sheet rejects too; there is nothing to report.
    }
  }

  const messenger = messengerUrl(url, facebookAppId, touch);
  const copyLabel = {
    idle: t("article.share.copy"),
    copied: t("article.share.copied"),
    failed: t("article.share.copyFailed"),
  }[copyState];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {touch && canShareNatively ? (
        <button type="button" onClick={shareNatively} className={buttonClasses({})}>
          {t("article.share.native")}
        </button>
      ) : (
        <span className="mr-1.5 font-mono text-[11px] tracking-label text-muted uppercase">
          {t("article.share.label")}
        </span>
      )}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "ink" })}
      >
        {t("article.share.facebook")}
      </a>
      {messenger && (
        <a
          href={messenger}
          target={touch ? undefined : "_blank"}
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "outline" })}
        >
          {t("article.share.messenger")}
        </a>
      )}
      <button
        type="button"
        onClick={copyLink}
        className={buttonClasses({ variant: "outline", className: "min-w-40" })}
      >
        {copyLabel}
      </button>
      <span role="status" className="sr-only">
        {copyState === "copied" ? t("article.share.copiedStatus") : ""}
      </span>
    </div>
  );
}
