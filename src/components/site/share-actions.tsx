"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/lib/cx";

const COPY_FEEDBACK_MS = 2000;

function subscribeToNothing() {
  return () => {};
}

interface NativeShareButtonProps {
  url: string;
  title: string;
  label: string;
  className?: string;
}

/**
 * The phone's share sheet. Rendered on the server so nothing moves after loading; the few touch
 * browsers without one drop the button.
 */
export function NativeShareButton({ url, title, label, className }: NativeShareButtonProps) {
  const supported = useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => true,
  );
  if (!supported) {
    return null;
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Closing the share sheet rejects too; there is nothing to report.
    }
  }

  return (
    <button type="button" onClick={share} className={cx(buttonClasses({}), className)}>
      {label}
    </button>
  );
}

type CopyState = "idle" | "copied" | "failed";

interface CopyLinkButtonProps {
  url: string;
  labels: Record<CopyState, string> & { copiedStatus: string };
}

export function CopyLinkButton({ url, labels }: CopyLinkButtonProps) {
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

  return (
    <>
      <button
        type="button"
        onClick={copyLink}
        className={buttonClasses({ variant: "outline", className: "min-w-40" })}
      >
        {labels[copyState]}
      </button>
      <span role="status" className="sr-only">
        {copyState === "copied" ? labels.copiedStatus : ""}
      </span>
    </>
  );
}
