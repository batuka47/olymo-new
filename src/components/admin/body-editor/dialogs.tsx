"use client";

import type { Editor } from "@tiptap/react";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { parseSocialUrl, parseYouTubeUrl, planEmbed } from "@/lib/editor/embeds";
import { t } from "@/lib/i18n";

/** Accepts http(s) and mailto links; "example.mn" becomes "https://example.mn". */
function normalizeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(/^[a-z][a-z+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

interface DialogProps {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}

function DialogButtons({ onCancel, extra }: { onCancel: () => void; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      {extra}
      <Button variant="outline" onClick={onCancel}>
        {t("editor.dialog.cancel")}
      </Button>
      <Button type="submit" variant="ink">
        {t("editor.dialog.insert")}
      </Button>
    </div>
  );
}

export function LinkDialog({ editor, open, onClose }: DialogProps) {
  const [error, setError] = useState<string>();
  const currentHref = editor.getAttributes("link").href as string | undefined;

  function close() {
    setError(undefined);
    onClose();
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = normalizeLink(String(new FormData(event.currentTarget).get("href") ?? ""));
    if (!href) {
      setError(t("admin.articles.link.invalid"));
      return;
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    close();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    close();
  }

  return (
    <Modal open={open} title={t("admin.articles.link.title")} onClose={close}>
      <form onSubmit={apply} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t("admin.articles.link.url")}
          name="href"
          type="url"
          inputMode="url"
          defaultValue={currentHref ?? "https://"}
          autoFocus
        />
        <FormMessage state={{ error }} />
        <DialogButtons
          onCancel={close}
          extra={
            currentHref && (
              <Button variant="outline" onClick={remove}>
                {t("admin.articles.link.remove")}
              </Button>
            )
          }
        />
      </form>
    </Modal>
  );
}

/** "YouTube" and "Сошиал пост": paste a link, checked before anything is inserted. */
export function PostLinkDialog({
  editor,
  open,
  onClose,
  kind,
}: DialogProps & { kind: "youtube" | "social" }) {
  const [error, setError] = useState<string>();

  function close() {
    setError(undefined);
    onClose();
  }

  function insert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const link = String(new FormData(event.currentTarget).get("url") ?? "");
    if (kind === "youtube") {
      const video = parseYouTubeUrl(link);
      if (!video) return setError(t("editor.youtube.invalid"));
      editor.chain().focus().insertContent({ type: "youtube", attrs: video }).run();
    } else {
      const post = parseSocialUrl(link);
      if (!post) return setError(t("editor.social.invalid"));
      editor
        .chain()
        .focus()
        .insertContent({ type: "socialEmbed", attrs: { url: post.url } })
        .run();
    }
    close();
  }

  return (
    <Modal open={open} title={t(`editor.${kind}.title`)} onClose={close}>
      <form onSubmit={insert} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t(`editor.${kind}.url`)}
          name="url"
          type="url"
          inputMode="url"
          hint={t(`editor.${kind}.hint`)}
          autoFocus
        />
        <FormMessage state={{ error }} />
        <DialogButtons onCancel={close} />
      </form>
    </Modal>
  );
}

/** "Embed": pasted code. A YouTube iframe becomes the YouTube block (see planEmbed). */
export function EmbedDialog({ editor, open, onClose }: DialogProps) {
  const [error, setError] = useState<string>();

  function close() {
    setError(undefined);
    onClose();
  }

  function insert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    if (!code) return setError(t("editor.embed.empty"));
    const plan = planEmbed(code);
    editor
      .chain()
      .focus()
      .insertContent(
        plan.kind === "youtube"
          ? { type: "youtube", attrs: plan.video }
          : { type: "embed", attrs: { code } },
      )
      .run();
    close();
  }

  return (
    <Modal open={open} title={t("editor.embed.title")} onClose={close}>
      <form onSubmit={insert} className="flex flex-col gap-4" noValidate>
        <TextAreaField
          label={t("editor.embed.code")}
          name="code"
          rows={6}
          hint={t("editor.embed.hint")}
          className="font-mono text-xs"
          autoFocus
        />
        <FormMessage state={{ error }} />
        <DialogButtons onCancel={close} />
      </form>
    </Modal>
  );
}
