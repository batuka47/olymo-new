"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: { sitekey: string; theme: "light"; size: "flexible"; language: "auto" },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileProps {
  /** Any value that changes after each answer from the server: a token works only once. */
  resetKey?: unknown;
}

/**
 * Cloudflare Turnstile. The widget puts its token in a hidden "cf-turnstile-response" input inside
 * the surrounding form; the server action verifies it (src/lib/spam/turnstile.ts).
 */
export function Turnstile({ resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const container = containerRef.current;
    if (!loaded || !container || !siteKey || !window.turnstile) {
      return;
    }
    widgetId.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "light",
      size: "flexible",
      language: "auto",
    });
    return () => {
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [loaded, siteKey]);

  const firstKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== firstKey.current && widgetId.current) {
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetKey]);

  if (!siteKey) {
    console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set; forms cannot pass the spam check.");
    return null;
  }
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setLoaded(true)}
      />
      {/* The widget's own height, so the button below does not jump when it appears. */}
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
