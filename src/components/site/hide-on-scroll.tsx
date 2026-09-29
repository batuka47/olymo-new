"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

const MIN_SCROLL_DELTA = 8;

interface HideOnScrollProps {
  children: ReactNode;
}

export function HideOnScroll({ children }: HideOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const element = ref.current;
      const y = window.scrollY;
      if (!element || Math.abs(y - lastY) < MIN_SCROLL_DELTA) {
        return;
      }
      const scrollingDown = y > lastY;
      const pastHeader = y > element.offsetHeight;
      const hasFocus = element.contains(document.activeElement);
      setHidden(scrollingDown && pastHeader && !hasFocus);
      lastY = y;
    }

    function handleScroll() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      onFocus={() => setHidden(false)}
      className={cx(
        "sticky top-0 z-40 bg-paper transition-transform duration-200 ease-out motion-reduce:transition-none",
        hidden && "-translate-y-full",
      )}
    >
      {children}
    </div>
  );
}
