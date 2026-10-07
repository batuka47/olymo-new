"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface EditorBarProps {
  title: string;
  /** Next to the title: state badge, save status. */
  status: ReactNode;
  actions: ReactNode;
}

/** The text toolbar sticks just below this bar; its height changes when the bar wraps. */
const HEIGHT_PROPERTY = "--editor-bar-height";

/** The sticky bar on top of an editor (articles, events, site pages). */
export function EditorBar({ title, status, actions }: EditorBarProps) {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const root = document.documentElement.style;
    const observer = new ResizeObserver(() =>
      root.setProperty(HEIGHT_PROPERTY, `${element.offsetHeight}px`),
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.removeProperty(HEIGHT_PROPERTY);
    };
  }, []);

  return (
    <header
      ref={bar}
      className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 lg:-mx-8 lg:px-8"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {status}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  );
}
