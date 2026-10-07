import { youTubePlayerUrl } from "@/lib/editor/embeds";

/**
 * The YouTube block shows only a thumbnail; a click swaps in the youtube-nocookie.com player, so
 * nothing from YouTube loads (or sets cookies) for readers who never press play.
 */
export function enhanceYouTube(figure: HTMLElement, title: string): () => void {
  const link = figure.querySelector<HTMLAnchorElement>("a.youtube-preview");
  const videoId = figure.dataset.youtube;
  if (!link || !videoId) return () => {};

  function play(event: MouseEvent) {
    event.preventDefault();
    const player = document.createElement("iframe");
    player.src = youTubePlayerUrl({
      videoId: videoId!,
      start: Number(figure.dataset.start) || null,
    });
    player.title = title;
    player.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    player.allowFullscreen = true;
    player.referrerPolicy = "strict-origin-when-cross-origin";
    player.className = "youtube-player";
    link!.replaceWith(player);
    player.focus();
  }

  link.addEventListener("click", play);
  // Until then a click opens the video on youtube.com, which is the right fallback.
  figure.dataset.enhanced = "";
  return () => {
    link.removeEventListener("click", play);
    delete figure.dataset.enhanced;
  };
}
