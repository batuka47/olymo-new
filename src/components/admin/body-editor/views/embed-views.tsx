"use client";

import { DOMSerializer } from "@tiptap/pm/model";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { watchEmbedHeights } from "@/lib/body-enhancers/embed-frames";
import { renderSocialPost } from "@/lib/body-enhancers/social";
import { parseSocialUrl, planEmbed } from "@/lib/editor/embeds";
import { embedSpec, socialPostSpec, youTubeSpec } from "@/lib/editor/nodes";
import { t } from "@/lib/i18n";
import { ViewButton } from "./view-field";

// The YouTube, social post and embed blocks in the editor: drawn from the same markup readers
// get (lib/editor/nodes.ts), so the preview is the real thing.

function useRenderedSpec(build: () => Node | null, deps: unknown[]) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = container.current;
    if (!target) return;
    const content = build();
    target.replaceChildren(...(content ? [content] : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt when the stored attributes change
  }, deps);
  return container;
}

function renderSpec(spec: Parameters<typeof DOMSerializer.renderSpec>[1]): Node {
  return DOMSerializer.renderSpec(document, spec).dom;
}

export function YouTubeView({ node, deleteNode, selected }: ReactNodeViewProps) {
  const videoId = String(node.attrs.videoId ?? "");
  const container = useRenderedSpec(
    () => renderSpec(youTubeSpec({ videoId, start: Number(node.attrs.start) || null })),
    [videoId, node.attrs.start],
  );
  return (
    <NodeViewWrapper className={cx("editor-embed", selected && "is-selected")} data-drag-handle>
      <div ref={container} contentEditable={false} />
      <div contentEditable={false} className="editor-block-fields">
        <ViewButton label={t("editor.handle.remove")} onClick={deleteNode} className="self-start" />
      </div>
    </NodeViewWrapper>
  );
}

export function SocialView({ node, deleteNode, selected }: ReactNodeViewProps) {
  const url = String(node.attrs.url ?? "");
  const container = useRenderedSpec(() => {
    const post = parseSocialUrl(url);
    if (!post) return null;
    const figure = document.createElement("figure");
    figure.className = "embed-social";
    figure.dataset.social = post.platform;
    figure.append(renderSpec(socialPostSpec(post)));
    void renderSocialPost(figure).catch(() => {
      // Offline or blocked: the link to the post stays visible.
    });
    return figure;
  }, [url]);

  return (
    <NodeViewWrapper className={cx("editor-embed", selected && "is-selected")} data-drag-handle>
      <div ref={container} contentEditable={false} />
      <div contentEditable={false} className="editor-block-fields">
        <p className="font-mono text-[11px] break-all text-muted">{url}</p>
        <ViewButton label={t("editor.handle.remove")} onClick={deleteNode} className="self-start" />
      </div>
    </NodeViewWrapper>
  );
}

export function EmbedView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const code = String(node.attrs.code ?? "");
  const [editing, setEditing] = useState(false);
  const textareaId = useId();
  const container = useRenderedSpec(
    () => renderSpec(embedSpec(code, node.attrs.title ? String(node.attrs.title) : null)),
    [code, node.attrs.title],
  );
  useEffect(() => {
    const target = container.current;
    return target ? watchEmbedHeights(target) : undefined;
  }, [container]);
  const sandboxed = planEmbed(code).kind === "sandbox";

  return (
    <NodeViewWrapper className={cx("editor-embed", selected && "is-selected")} data-drag-handle>
      <div ref={container} contentEditable={false} />
      <div contentEditable={false} className="editor-block-fields">
        <p className="text-xs text-muted">
          {sandboxed ? t("editor.embed.sandboxed") : t("editor.embed.direct")}
        </p>
        {editing && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={textareaId}
              className="font-mono text-[10px] tracking-label text-muted uppercase"
            >
              {t("editor.embed.code")}
            </label>
            <textarea
              id={textareaId}
              defaultValue={code}
              rows={5}
              onBlur={(event) => updateAttributes({ code: event.target.value.trim() })}
              className="w-full border border-line bg-white p-2 font-mono text-xs"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          <ViewButton
            label={t("editor.embed.edit")}
            pressed={editing}
            onClick={() => setEditing(!editing)}
          />
          <ViewButton label={t("editor.handle.remove")} onClick={deleteNode} />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
