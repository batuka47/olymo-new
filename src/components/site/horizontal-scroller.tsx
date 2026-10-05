"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";

interface HorizontalScrollerProps {
  /** Left side of the row above the cards; the prev/next buttons sit on the right. */
  header: ReactNode;
  /** The <li> cards. Give them a width and snap-start. */
  children: ReactNode;
  /** Names of the prev/next buttons. */
  labels: { previous: string; next: string };
}

/** A mouse has to move this far before a press becomes a drag (and the click is cancelled). */
const DRAG_THRESHOLD_PX = 6;
/** One button press scrolls most of the visible width; snapping lines the next card up. */
const PAGE_FRACTION = 0.8;

interface Drag {
  startX: number;
  startScroll: number;
  moved: boolean;
}

/**
 * Cards in a row that scroll sideways: swipe on touch screens, drag with the mouse, or use the
 * buttons. The first card lines up with the page content; the row runs to the right edge.
 */
export function HorizontalScroller({ header, children, labels }: HorizontalScrollerProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const updateEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const atStart = list.scrollLeft <= 1;
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
    setEdges((current) =>
      current.atStart === atStart && current.atEnd === atEnd ? current : { atStart, atEnd },
    );
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    // Also runs once right away, which sets the initial button state.
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    list.addEventListener("scroll", updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateEdges);
    };
  }, [updateEdges]);

  function scrollByPage(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({
      left: direction * list.clientWidth * PAGE_FRACTION,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function startDrag(event: PointerEvent<HTMLUListElement>) {
    // A drag does not always end in a click, so a leftover flag must not swallow this press.
    suppressClick.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    drag.current = {
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
      moved: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLUListElement>) {
    const current = drag.current;
    if (!current) {
      return;
    }
    const distance = event.clientX - current.startX;
    if (!current.moved) {
      if (Math.abs(distance) < DRAG_THRESHOLD_PX) {
        return;
      }
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    event.currentTarget.scrollLeft = current.startScroll - distance;
  }

  function endDrag() {
    suppressClick.current = drag.current?.moved ?? false;
    drag.current = null;
    setDragging(false);
  }

  // A drag ends on top of a card; that release must not open the card.
  function cancelClickAfterDrag(event: MouseEvent<HTMLUListElement>) {
    if (suppressClick.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
  }

  const buttonClasses =
    "inline-flex size-12 cursor-pointer items-center justify-center text-lg transition-opacity disabled:cursor-default disabled:opacity-30";

  return (
    <div>
      <Container>
        <div className="flex items-end justify-between gap-6 border-b border-ink-line pb-5 lg:pb-8">
          <div>{header}</div>
          <div className="hidden shrink-0 gap-2 lg:flex">
            <button
              type="button"
              aria-label={labels.previous}
              disabled={edges.atStart}
              onClick={() => scrollByPage(-1)}
              className={cx(buttonClasses, "border border-paper text-paper")}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label={labels.next}
              disabled={edges.atEnd}
              onClick={() => scrollByPage(1)}
              className={cx(buttonClasses, "bg-lime text-ink")}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </Container>
      <ul
        ref={listRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={cancelClickAfterDrag}
        onDragStart={(event) => event.preventDefault()}
        className={cx(
          // relative: absolutely positioned bits in the cards (sr-only text) stay inside the row
          // instead of widening the page.
          "relative mt-5 flex scrollbar-none gap-3 overflow-x-auto px-4 lg:mt-8 lg:gap-5 lg:pr-16",
          // Line the first card up with the 1440 px page content, however wide the window is.
          "scroll-pl-4 lg:scroll-pl-[max(64px,calc((100vw-1440px)/2+64px))] lg:pl-[max(64px,calc((100vw-1440px)/2+64px))]",
          dragging ? "cursor-grabbing snap-none select-none" : "snap-x snap-mandatory",
        )}
      >
        {children}
      </ul>
    </div>
  );
}
