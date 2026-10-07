import type { Extensions } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { textExtensions } from "@/lib/editor/extensions";
import { Embed, FigureImage, Gallery, Quote, SocialEmbed, YouTube } from "@/lib/editor/nodes";
import { ImageFiles } from "./editor-events";
import { SlashCommand } from "./slash-menu";
import { EmbedView, SocialView, YouTubeView } from "./views/embed-views";
import { GalleryView } from "./views/gallery-view";
import { ImageView } from "./views/image-view";
import { QuoteView } from "./views/quote-view";

/**
 * The article schema (lib/editor/extensions.ts) with editing on top: React views for the blocks,
 * the placeholder, the "/" menu and pasted or dropped images. The stored JSON is the same.
 */
export function editorExtensions(placeholder: string): Extensions {
  return [
    ...textExtensions,
    Quote.extend({ addNodeView: () => ReactNodeViewRenderer(QuoteView) }),
    FigureImage.extend({ addNodeView: () => ReactNodeViewRenderer(ImageView) }),
    Gallery.extend({ addNodeView: () => ReactNodeViewRenderer(GalleryView) }),
    YouTube.extend({ addNodeView: () => ReactNodeViewRenderer(YouTubeView) }),
    SocialEmbed.extend({ addNodeView: () => ReactNodeViewRenderer(SocialView) }),
    Embed.extend({ addNodeView: () => ReactNodeViewRenderer(EmbedView) }),
    Placeholder.configure({ placeholder }),
    SlashCommand,
    ImageFiles,
  ];
}
