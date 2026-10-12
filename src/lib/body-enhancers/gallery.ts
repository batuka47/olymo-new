export interface GalleryLabels {
  previous: string;
  next: string;
}

function arrowButton(label: string, direction: "previous" | "next"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `gallery-arrow gallery-arrow-${direction}`;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<span aria-hidden="true">${direction === "previous" ? "←" : "→"}</span>`;
  return button;
}

/**
 * The image slider: swiping works with CSS alone (scroll snapping); this adds the arrows, which
 * step one image at a time and switch off at either end.
 */
export function enhanceGallery(figure: HTMLElement, labels: GalleryLabels): () => void {
  const track = figure.querySelector<HTMLElement>(".gallery-track");
  if (!track || track.children.length < 2) return () => {};

  const previous = arrowButton(labels.previous, "previous");
  const next = arrowButton(labels.next, "next");
  figure.append(previous, next);

  const step = (direction: -1 | 1) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };
  const update = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };
  const goBack = () => step(-1);
  const goOn = () => step(1);

  previous.addEventListener("click", goBack);
  next.addEventListener("click", goOn);
  track.addEventListener("scroll", update, { passive: true });
  update();

  return () => {
    track.removeEventListener("scroll", update);
    previous.remove();
    next.remove();
  };
}
