import { EMBED_HEIGHT, EMBED_HEIGHT_MESSAGE, EMBED_HEIGHT_REQUEST } from "@/lib/editor/embeds";

/**
 * Sandboxed embeds report their content height (see sandboxDocument); the frame grows to fit.
 * A message is trusted only from one of `root`'s own sandboxed frames, and only for its height.
 */
export function watchEmbedHeights(root: HTMLElement): () => void {
  const frames = () => [
    ...root.querySelectorAll<HTMLIFrameElement>('[data-embed="sandbox"] iframe'),
  ];

  function resize(event: MessageEvent) {
    const data = event.data as { type?: unknown; height?: unknown } | null;
    if (data?.type !== EMBED_HEIGHT_MESSAGE || typeof data.height !== "number") return;
    const frame = frames().find((candidate) => candidate.contentWindow === event.source);
    if (!frame) return;
    const height = Math.min(EMBED_HEIGHT.max, Math.max(EMBED_HEIGHT.min, Math.ceil(data.height)));
    frame.style.height = `${height}px`;
  }

  window.addEventListener("message", resize);
  // Frames that loaded before this listener have already reported; ask them again.
  for (const frame of frames()) {
    frame.contentWindow?.postMessage({ type: EMBED_HEIGHT_REQUEST }, "*");
  }
  return () => window.removeEventListener("message", resize);
}
